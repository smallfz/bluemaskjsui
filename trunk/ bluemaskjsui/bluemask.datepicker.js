/* copyright(C)2010 bluemask.net */

var DatePicker = {
	Config: {
		WeekLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
		LabelClose: "Close",
		ResultFormater: function (date) {
			return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
		},
		LabelFormater: function (date) {
			return date.getFullYear() + "-" + (date.getMonth() + 1);
		},
		Mode: "" /* '', 'month', 'year' */,
		IsDaysMode: function () {
			if (!this.Mode || this.Mode == "day" || this.Mode == "days") {
				return true;
			}
			return false;
		},
		IsMonthMode: function () {
			if (this.Mode == "month" || this.Mode.toLowerCase() == "month") {
				return true;
			}
			return false;
		},
		IsYearMode: function () {
			if (this.Mode == "year" || this.Mode.toLowerCase() == "year") {
				return true;
			}
			return false;
		}
	},
	_calelements: { bk: null, container: null },
	_attachedObjects: [/* {element/HtmlElement, config/object, open/bool} */],
	_activeObject: null,

	ParseDate: function (str, failvalue) {
		var result = new Date(str);
		if (isNaN(result.getFullYear())) {
			var re = /^(\d{4})[^\d](\d{1,2})[^\d](\d{1,2})$/;
			var m = str.match(re);
			if (m) {
				if (m.length >= 4) {
					var yyyy = parseInt(m[1]), mm = parseInt(m[2]), dd = parseInt(m[3]);
					result = new Date();
					result.setYear(yyyy);
					result.setMonth(mm - 1);
					result.setDate(dd);
					return result;
				}
			}
			re = /^(\d{4})[^\d](\d{1,2})$/;
			m = str.match(re);
			if (m) {
				if (m.length >= 3) {
					var yyyy = parseInt(m[1]), mm = parseInt(m[2]), dd = 1;
					result = new Date();
					result.setYear(yyyy);
					result.setMonth(mm - 1);
					result.setDate(dd);
					return result;
				}
			}
			re = /^(\d{4})$/;
			m = str.match(re);
			if (m) {
				if (m.length >= 2) {
					var yyyy = parseInt(m[1]), mm = 1, dd = 1;
					result = new Date();
					result.setYear(yyyy);
					result.setMonth(mm - 1);
					result.setDate(dd);
					return result;
				}
			}
			return failvalue;
		}
		return result;
	},

	GetMonthDaysCount: function (y, m) {
		if (",1,3,5,7,8,10,12,".indexOf("," + m + ",") >= 0) {
			return 31;
		} else if (m == 2) {
			if ((y % 4 == 0 && y % 100 != 0) || y % 400 == 0) {
				return 29;
			}
			return 28;
		}
		return 30;
	},

	AddDays: function (date, dayscount) {
		var newtime = date.getTime() + 1000 * 60 * 60 * 24 * dayscount;
		var result = new Date();
		result.setTime(newtime);
		return result;
	},

	AddMonth: function (date, monthcount) {
		var totalmonth = date.getFullYear() * 12 + (date.getMonth() + 1) + monthcount;
		var result = new Date(), y = parseInt(totalmonth / 12), m = parseInt(totalmonth % 12);
		result.setYear(y);
		result.setMonth(m - 1);
		var d = date.getDate();
		var dayscountinmonth = this.GetMonthDaysCount(y, m);
		if (d > dayscountinmonth) { d = dayscountinmonth; }
		result.setDate(d);
		return result;
	},

	DefaultDateFormater: function (d) {
		return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
	},

	DefaultMonthLabelFormater: function (d) {
		return d.getFullYear() + "-" + (d.getMonth() + 1);
	},

	FormatDate: function (date) {
		if (this._activeObject) {
			if (this._activeObject.config) {
				if (this._activeObject.config.formater) {
					if (typeof (this._activeObject.config.formater) == "function") {
						return this._activeObject.config.formater(date);
					}
				}
			}
		}
		if (this.Config.ResultFormater) {
			if (typeof (this.Config.ResultFormater) == "function") {
				return this.Config.ResultFormater(date);
			}
		}
		return this.DefaultDateFormater(date);
	},

	FormatMonth: function (date) {
		if (this._activeObject) {
			if (this._activeObject.config) {
				if (this._activeObject.config.labelformater) {
					if (typeof (this._activeObject.config.labelformater) == "function") {
						return this._activeObject.config.labelformater(date);
					}
				}
			}
		}
		if (this.Config.LabelFormater) {
			if (typeof (this.Config.LabelFormater) == "function") {
				return this.Config.LabelFormater(date);
			}
		}
		return this.DefaultMonthLabelFormater(date);
	},

	IsSameDay: function (d1, d2) {
		return d1.getFullYear() == d2.getFullYear() && d1.getDate() == d2.getDate() && d1.getMonth() == d2.getMonth();
	},

	ShowCalendar: function (rect, selecteddate, pagedate, callback) {
		var root = this;
		var calobj = this._calelements;
		var conf = this.Config;
		var bk = calobj.bk;
		var container = calobj.container;
		if (!container || !bk) {
			//
			bk = document.createElement("span");
			document.body.appendChild(bk);
			bk.className = "datepicker";
			bk.style.cssText = "display:none;";
			//
			// back-iframe
			var bkframe = document.createElement("iframe");
			bk.appendChild(bkframe);
			bkframe.style.cssText = "";
			bkframe.src = "javascript:;";
			// container
			container = document.createElement("span");
			container.className = "container";
			bk.appendChild(container);
			calobj.bk = bk;
			calobj.container = container;
			container.onselectstart = function () { return false; }
		}
		container.innerHTML = "";
		//
		if (root.Config.IsMonthMode() || root.Config.IsYearMode()) {
			callback(pagedate);
		}
		// data perparing
		var cells = this.GetMetaCells(pagedate, selecteddate);
		// elements/table building
		bk.style.cssText = "display:block; position:absolute; left:" + (rect.x + 1) + "px; top:" + (rect.y + 1) + "px;";
		// header
		var headrow = document.createElement("span");
		container.appendChild(headrow);
		headrow.className = "headrow";
		var headlabel = document.createElement("span");
		headrow.appendChild(headlabel);
		headlabel.className = "label";
		headlabel.innerHTML = this.FormatMonth(pagedate);
		if (root.Config.IsMonthMode() || root.Config.IsYearMode()) {
			headlabel.onmouseover = function () {
				this.className = "labelhover";
			};
			headlabel.onmouseout = function () {
				this.className = "label";
			};
			headlabel.onclick = function () {
				callback(pagedate);
			};
		}
		// header:headhandlers
		var headhandlers = document.createElement("span");
		container.appendChild(headhandlers);
		headhandlers.className = "headhandlers";
		// header:left
		var headleft = document.createElement("span");
		headhandlers.appendChild(headleft);
		headleft.className = "left";
		var btnprevyear = document.createElement("a");
		headleft.appendChild(btnprevyear);
		btnprevyear.innerHTML = "&laquo;";
		btnprevyear.onclick = function () {
			var newdate = root.AddMonth(pagedate, -12);
			root.ShowCalendar.call(root, rect, selecteddate, newdate, callback);
		};
		if (root.Config.IsDaysMode() || root.Config.IsMonthMode()) {
			var btnprevmonth = document.createElement("a");
			headleft.appendChild(btnprevmonth);
			btnprevmonth.innerHTML = "&lsaquo;";
			btnprevmonth.onclick = function () {
				var newdate = root.AddMonth(pagedate, -1);
				root.ShowCalendar.call(root, rect, selecteddate, newdate, callback);
			};
		}
		// header:mid
		var headmid = document.createElement("span");
		headhandlers.appendChild(headmid);
		headmid.className = "mid";
		// header:right
		var headright = document.createElement("span");
		headhandlers.appendChild(headright);
		headright.className = "right";
		if (root.Config.IsDaysMode() || root.Config.IsMonthMode()) {
			var btnnextmonth = document.createElement("a");
			headright.appendChild(btnnextmonth);
			btnnextmonth.innerHTML = "&rsaquo;";
			btnnextmonth.onclick = function () {
				var newdate = root.AddMonth(pagedate, 1);
				root.ShowCalendar.call(root, rect, selecteddate, newdate, callback);
			};
		}
		var btnnextyear = document.createElement("a");
		headright.appendChild(btnnextyear);
		btnnextyear.innerHTML = "&raquo;";
		btnnextyear.onclick = function () {
			var newdate = root.AddMonth(pagedate, 12);
			root.ShowCalendar.call(root, rect, selecteddate, newdate, callback);
		};

		if (root.Config.IsDaysMode()) {
			// table/cells
			var table = document.createElement("span");
			container.appendChild(table);
			table.className = "table";
			// week labels
			var weeklabelrow = document.createElement("span");
			table.appendChild(weeklabelrow);
			weeklabelrow.className = "weekrow";
			var weeklabels = this.Config.WeekLabels;
			for (var i = 0; i < weeklabels.length; i++) {
				var weeklabel = document.createElement("span");
				weeklabelrow.appendChild(weeklabel);
				weeklabel.className = "cell";
				weeklabel.innerHTML = weeklabels[i];
			}
			// cells
			var cellrow = document.createElement("span");
			table.appendChild(cellrow);
			cellrow.className = "row";
			for (var i = 0; i < cells.length; i++) {
				this.CreateCellAndAppendTo(cellrow, cells[i], callback, "");
				if ((i + 1) >= 7 && (i + 1) % 7 == 0 && i < cells.length - 1) {
					cellrow = document.createElement("span");
					table.appendChild(cellrow);
					cellrow.className = "row";
				}
			}
		}
		// bottom controls
		var bottomrow = document.createElement("span");
		container.appendChild(bottomrow);
		bottomrow.className = "bottom";
		//if (root.Config.IsDaysMode()) {
		var btnclose = document.createElement("span");
		bottomrow.appendChild(btnclose);
		btnclose.className = "close";
		btnclose.innerHTML = this.Config.LabelClose;
		btnclose.onclick = function () {
			root.Close.call(root);
		};
		//}
	},

	GetMetaCells: function (date, selecteddate) {
		var m = date.getMonth() + 1, y = date.getFullYear();
		var dayscount = this.GetMonthDaysCount(y, m);
		var now = new Date();
		var firstday = new Date(y, m - 1, 1);
		var firstdayofgrid = this.AddDays(firstday, firstday.getDay() * -1);
		var cells = [];
		for (var i = 0; i < 42; i++) {
			var weekday = i >= 7 ? i % 7 : i;
			var celldate = this.AddDays(firstdayofgrid, i);
			cells.push({
				label: celldate.getDate(),
				date: celldate,
				incurrentmonth: celldate.getMonth() == m - 1,
				istoday: this.IsSameDay(celldate, now),
				selected: this.IsSameDay(celldate, selecteddate),
				clickable: true
			});
		}
		return cells;
	},

	CreateCellAndAppendTo: function (container, metacell, callback, cssText) {
		var cell = document.createElement("span");
		container.appendChild(cell);
		if (metacell.selected) {
			cell.className = "cell selected";
		} else if (metacell.istoday) {
			cell.className = "cell today";
		} else if (metacell.incurrentmonth) {
			cell.className = "cell in";
		} else {
			cell.className = "cell out";
		}
		//cell.style.cssText=cssText;
		cell.innerHTML = metacell.label;
		if (callback) {
			cell.onclick = function () {
				callback(metacell.date);
			};
		}
		return cell;
	},

	Show: function (obj) {
		if (!obj) { return; }
		this._activeObject = obj;
		var root = this;
		var pos = this.GetElementPos(obj.element);
		var rect = { x: pos.x, y: pos.y, width: obj.element.offsetWidth, height: obj.element.offsetHeight };
		var now = new Date();
		var predate = this.ParseDate(obj.element.value, now);
		//alert(obj.element.value+"\n"+predate);
		this.ShowCalendar(rect, predate, predate, function (d) {
			var datestr = root.FormatDate(d);
			obj.element.value = datestr;
			root.Close.call(root);
		});
	},

	Close: function () {
		var calbk = this._calelements.bk;
		if (calbk) {
			calbk.style.cssText = "display:none;";
		}
		this._activeObject = null;
	},

	/* Attach (elementid, [ object{formater:f(date), labelformater:f(date),} ]) */
	Attach: function (elementid, config) {
		var root = this;
		var ctl = document.getElementById(elementid);
		if (!ctl) { return; }
		var obj = { element: ctl, config: config, open: false };
		this._attachedObjects.push(obj);
		var trigger = function () {
			root.Show.call(root, obj);
		};
		var esc = function (k) {
			var isEsc = false;
			if (k) {
				if (k.keyCode == 27) {
					isEsc = true;
				}
			} else if (window.event) {
				if (window.event.keyCode == 27) {
					isEsc = true;
				}
			}
			if (isEsc) {
				root.Close.call(root);
			}
		};
		ctl.onclick = trigger;
		ctl.onfocus = trigger;
		ctl.onkeydown = esc;
	},

	GetElementPos: function (obj) {
		return { y: this.GetElementTop(obj), x: this.GetElementLeft(obj) };
	},
	GetElementTop: function (obj) {
		if (!obj) { return 0; }
		var _t = obj.offsetTop;
		if (obj.offsetParent) { _t += this.GetElementTop(obj.offsetParent); }
		return _t;
	},
	GetElementLeft: function (obj) {
		if (!obj) { return 0; }
		var _t = obj.offsetLeft;
		if (obj.offsetParent) { _t += this.GetElementLeft(obj.offsetParent); }
		return _t;
	}

};