/**
 * rmFormat plugin
 *
 * Depends on jWYSIWYG
 */
(function ($) {
	if (undefined === $.wysiwyg) {
		throw "wysiwyg.rmFormat.js depends on $.wysiwyg";
	}

	/*
	 * Wysiwyg namespace: public properties and methods
	 */
	var rmFormat = {
		name: "rmFormat",
		version: "",
		defaults: {
			rules: {
				heading: false,
				table: false,
				msWordMarkup: false
			}
		},
		options: {},
		enabled: false,
		debug:	false,

		domRemove: function (node) {
			// replace h1-h6 with p
			if (this.options.rules.heading) {
				if (node.nodeName.toLowerCase().match(/^h[1-6]$/)) {
					// in chromium change this to
					// $(node).replaceWith($('<p/>').html(node.innerHTML));
					// to except DOM error: also try in other browsers
					$(node).replaceWith($('<p/>').html($(node).contents()));

					return true;
				}
			}

			// remove tables not smart enough )
			if (this.options.rules.table) {
				if (node.nodeName.toLowerCase().match(/^(table|t[dhr]|t(body|foot|head))$/)) {
					$(node).replaceWith($(node).contents());

					return true;
				}
			}

			return false;
		},

		domTraversing: function (el, start, end, canRemove, cnt) {
			if (null === canRemove) {
				canRemove = false;
			}

			var isDomRemoved, p;

			while (el) {
				if (this.debug) { console.log(cnt, "canRemove=", canRemove); }

				if (el.firstElementChild) {

					if (this.debug) { console.log(cnt, "domTraversing", el.firstElementChild); }

					return this.domTraversing(el.firstElementChild, start, end, canRemove, cnt + 1);
				} else {

					if (this.debug) { console.log(cnt, "routine", el); }

					isDomRemoved = false;

					if (start === el) {
						canRemove = true;
					}

					if (canRemove) {
						if (el.previousElementSibling) {
							p = el.previousElementSibling;
						} else {
							p = el.parentNode;
						}

						if (this.debug) { console.log(cnt, el.nodeName, el.previousElementSibling, el.parentNode, p); }

						isDomRemoved = this.domRemove(el);
						if (this.domRemove(el)) {

							if (this.debug) { console.log("p", p); }

							// step back to parent or previousElement to traverse again then element is removed
							el = p;
						}

						if (start !== end && end === el) {
							return true;
						}
					}

					if (false === isDomRemoved) {
						el = el.nextElementSibling;
					}
				}
			}

			return false;
		},

		msWordMarkup: function (text) {
			text = text.replace(/<meta\s[^>]+>/g, "");
			text = text.replace(/<link\s[^>]+>/g, "");
			text = text.replace(/<title>[\s\S]*?<\/title>/g, "");
			text = text.replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gm, "");
			text = text.replace(/<w:([^\s>]+)(?:\s[^\/]+)?\/>/g, "");
			text = text.replace(/<w:([^\s>]+)(?:\s[^>]+)?>[\s\S]*?<\/w:\1>/g, "");
			text = text.replace(/<m:([^\s>]+)(?:\s[^\/]+)?\/>/g, "");
			text = text.replace(/<m:([^\s>]+)(?:\s[^>]+)?>[\s\S]*?<\/m:\1>/g, "");
			text = text.replace(/^[\s\n]+/gm, "");

			return text;
		},

		run: function (Wysiwyg, options) {
			options = options || {};
			this.options = $.extend(true, this.defaults, options);

			if (this.options.rules.heading || this.options.rules.table) {
				var r = Wysiwyg.getInternalRange(),
					start,
					end,
					node,
					traversing;

				start = r.startContainer;
				if (start.nodeType === 3) {
					start = start.parentNode;
				}

				end = r.endContainer;
				if (end.nodeType === 3) {
					end = end.parentNode;
				}

				if (this.debug) {
					console.log("start", start, start.nodeType, start.nodeName, start.parentNode);
					console.log("end", end, end.nodeType, end.nodeName, end.parentNode);
				}

				node = r.commonAncestorContainer;
				if (node.nodeType === 3) {
					node = node.parentNode;
				}

				if (this.debug) {
					console.log("node", node, node.nodeType, node.nodeName.toLowerCase(), node.parentNode, node.firstElementChild);
					console.log(start === end);
				}

				traversing = null;
				if (start === end) {
					traversing = this.domTraversing(node, start, end, true, 1);
				} else {
					traversing = this.domTraversing(node.firstElementChild, start, end, null, 1);
				}

				if (this.debug) { console.log("DomTraversing=", traversing); }
			}

			if (this.options.rules.msWordMarkup) {
				Wysiwyg.setContent(this.msWordMarkup(Wysiwyg.getContent()));
			}
		}
	};

	$.wysiwyg.plugin.register(rmFormat);
})(jQuery);