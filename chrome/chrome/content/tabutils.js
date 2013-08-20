var tabutils = {
  init: function() {
    this._tabEventListeners.init();
    this._PlacesUtilsExt();

    this._openUILinkInTab();
    this._openLinkInTab();
    this._singleWindowMode();

    this._tabOpeningOptions();
    this._tabClosingOptions();
    this._tabClickingOptions();

    this._unreadTab();
    this._protectAndLockTab();
    this._faviconizeTab();
    this._pinTab();
    this._hideTab();
    this._renameTab();
    this._restartTab();
    this._reloadEvery();
    this._bookmarkTabs();
    this._multiTabHandler();
    this._groupTabs();
    this._multirowTabs();
    this._miscFeatures();

    window.addEventListener("load", this, false);
    window.addEventListener("unload", this, false);

    if (gBrowser.mTabListeners.length > 0) { //Fx 5.0+
      gBrowser.mTabFilters[0].removeProgressListener(gBrowser.mTabListeners[0]);
      gBrowser.mTabListeners[0] = gBrowser.mTabProgressListener(gBrowser.mTabs[0], gBrowser.browsers[0], gBrowser.mTabListeners[0].mBlank);
      gBrowser.mTabFilters[0].addProgressListener(gBrowser.mTabListeners[0], Ci.nsIWebProgress.NOTIFY_ALL);
    }

//    Function.prototype.__defineGetter__("stack", function() {
//      var stack = [];
//      for (let caller = this; caller && stack.length < 15; caller = caller.caller) {
//        stack.push(caller.name);
//      }
//      return stack;
//    });

//    TU_hookCode("gBrowser.addTab", "{", "Cu.reportError(arguments.callee.stack);");
//    TU_hookCode("gBrowser.removeTab", "{", "Cu.reportError(arguments.callee.stack);");
//    TU_hookCode("gBrowser.moveTabTo", "{", "Cu.reportError([arguments.callee.stack, aTab._tPos, aIndex]);");
//    TU_hookSetter("gBrowser.selectedTab", "{", "Cu.reportError(arguments.callee.stack);");
//
//    TU_hookCode("gBrowser.unreadTab", "{", "Cu.reportError(arguments.callee.stack);");
//    TU_hookCode("gBrowser.pinTab", "{", "Cu.reportError(arguments.callee.stack);");
//    TU_hookCode("gBrowser.mTabContainer.adjustTabstrip", "{", "Cu.reportError(arguments.callee.stack);");
//    TU_hookCode("gBrowser.mTabContainer.positionPinnedTabs", "{", "Cu.reportError(arguments.callee.stack);");
//    TU_hookCode("gBrowser.mTabContainer.stylePinnedTabs", "{", "Cu.reportError(arguments.callee.stack);");
  },

  onload: function() {
    this._mainContextMenu();
    this._tabContextMenu();
    this._allTabsPopup();
    this._hideTabBar();
    this._undoCloseTabButton();
    this._tabPrefObserver.init();
    this._tagsFolderObserver.init();

    this._firstRun();
  },

  getTabValue: function(aTab, aKey) {
    let val = this._ss.getTabValue(aTab, aKey);
    if (!val) {
      let tabData = aTab.linkedBrowser.__SS_data;
      if (tabData)
        val = tabData.attributes[aKey] || tabData[aKey];
    }
    return val == null ? "" : val.toString();
  },

  setTabValue: function() this._ss.setTabValue.apply(this._ss, arguments),
  deleteTabValue: function() this._ss.deleteTabValue.apply(this._ss, arguments),

  setAttribute: function(aTab, aAttr, aVal) {
    aTab.setAttribute(aAttr, aVal);
    this.setTabValue(aTab, aAttr, aVal);
  },

  removeAttribute: function(aTab, aAttr) {
    aTab.removeAttribute(aAttr);
    this.deleteTabValue(aTab, aAttr);
  },

  restoreAttribute: function(aTab, aAttr) {
    let aVal = this.getTabValue(aTab, aAttr);
    if (aVal)
      aTab.setAttribute(aAttr, aVal);
    else
      aTab.removeAttribute(aAttr);
  },

  getURIsForTag: function() this._tagsFolderObserver.getURIsForTag.apply(this._tagsFolderObserver, arguments),
  getTagsForURI: function() this._tagsFolderObserver.getTagsForURI.apply(this._tagsFolderObserver, arguments),

  getDomainFromURI: function(aURI, aAllowThirdPartyFixup) {
    try {
      if (typeof aURI == "string")
        aURI = this._URIFixup.createFixupURI(aURI, aAllowThirdPartyFixup);
    }
    catch (e) {}

    try {
      return this._eTLDService.getBaseDomain(aURI);
    }
    catch (e) {}

    try {
      return aURI.host;
    }
    catch (e) {
      return aURI.spec;
    }
  },

  get _styleSheet() {
    for (let i = 0, styleSheet; styleSheet = document.styleSheets[i]; i++) {
      if (styleSheet.href == "chrome://tabutils/skin/tabutils.css") {
        delete this._styleSheet;
        return this._styleSheet = styleSheet;
      }
    }
    return document.styleSheets[0];
  },

  insertRule: function(rule) {
    var ss = this._styleSheet;
    return ss.cssRules[ss.insertRule(rule, ss.cssRules.length)];
  },

  dispatchEvent: function() {
    let event = document.createEvent("Events");
    event.initEvent.apply(event, Array.slice(arguments, 1));
    arguments[0].dispatchEvent(event);
  },

  _eventListeners: [],
  addEventListener: function() {
    document.addEventListener.apply(arguments[0], Array.slice(arguments, 1));
    this._eventListeners.push(arguments);
  },

  onunload: function() {
    this._eventListeners.forEach(function(args) document.removeEventListener.apply(args[0], Array.slice(args, 1)));
    this._tagsFolderObserver.uninit();
  },

  handleEvent: function(event) {
    window.removeEventListener(event.type, this, false);
    switch (event.type) {
      case "DOMContentLoaded": this.init();break;
      case "load": this.onload();break;
      case "unload": this.onunload();break;
    }
  }
};
window.addEventListener("DOMContentLoaded", tabutils, false);

XPCOMUtils.defineLazyServiceGetter(tabutils, "_ss",
                                   "@mozilla.org/browser/sessionstore;1",
                                   "nsISessionStore");

XPCOMUtils.defineLazyServiceGetter(tabutils, "_URIFixup",
                                   "@mozilla.org/docshell/urifixup;1",
                                   "nsIURIFixup");

XPCOMUtils.defineLazyServiceGetter(tabutils, "_eTLDService",
                                   "@mozilla.org/network/effective-tld-service;1",
                                   "nsIEffectiveTLDService");

tabutils._tabEventListeners = {
  init: function() {
    TU_hookCode("gBrowser.addTab",
      ["{", "if (!aURI) aURI = 'about:blank';"],
      [/(?=var evt)/, function() {
        t.arguments = {
          aURI: aURI,
          aReferrerURI: aReferrerURI,
          aRelatedToCurrent: aRelatedToCurrent
        };
      }]
    );

    gBrowser.onTabOpen = function onTabOpen(aTab) {
      var aURI, aReferrerURI, aRelatedToCurrent;
      if (aTab.arguments) {
        aURI = aTab.arguments.aURI;
        aReferrerURI = aTab.arguments.aReferrerURI;
        aRelatedToCurrent = aTab.arguments.aRelatedToCurrent;
      }

      var uri, tags = [];
      try {
        uri = makeURI(aURI);
      }
      catch (e) {
        uri = makeURI("about:blank");
      }

      if (uri.spec != "about:blank")
        tags = tabutils.getTagsForURI(uri, {});
    };

    gBrowser.onLocationChange = function onLocationChange(aTab) {
      var uri = aTab.linkedBrowser.currentURI;
      var tags = tabutils.getTagsForURI(uri, {});
    };

    TU_hookCode("gBrowser.mTabProgressListener", /(?=this.mBrowser.missingPlugins)/, function() {
      if (aWebProgress.DOMWindow == this.mBrowser.contentWindow &&
          this.mBrowser.currentURI.spec != "about:blank" &&
          (!this.mBrowser.lastURI || isBlankPageURL(this.mBrowser.lastURI.spec)) &&
          (!this.mBrowser.__SS_data || !this.mBrowser.__SS_data._tabStillLoading))
        this.mTabBrowser.onLocationChange(this.mTab);
    });

    gBrowser.onTabMove = function onTabMove(aTab, event) {};
    gBrowser.onTabClose = function onTabClose(aTab) {};
    gBrowser.onTabSelect = function onTabSelect(aTab) {};
    gBrowser.onTabBlur = function onTabBlur(aTab) {};
    gBrowser.onTabPinning = function onTabPinning(aTab) {};
    gBrowser.onTabPinned = function onTabPinned(aTab) {};
    gBrowser.onTabHide = function onTabHide(aTab) {};
    gBrowser.onTabShow = function onTabShow(aTab) {};
    gBrowser.onTabStacked = function onTabStacked(aTab) {};
    gBrowser.onTabUnstacked = function onTabUnstacked(aTab) {};
    gBrowser.onStackCollapsed = function onStackCollapsed(aTab) {};
    gBrowser.onStackExpanded = function onStackExpanded(aTab) {};
    gBrowser.onTabRestoring = function onTabRestoring(aTab) {var ss = tabutils._ss;};
    gBrowser.onTabRestored = function onTabRestored(aTab) {var ss = tabutils._ss;};
    gBrowser.onTabClosing = function onTabClosing(aTab) {var ss = tabutils._ss;};

    [
      "TabOpen", "TabMove", "TabClose", "TabSelect", "TabBlur",
      "TabPinning", "TabPinned", "TabHide", "TabShow",
      "TabStacked", "TabUnstacked", "StackCollapsed", "StackExpanded",
      "SSTabRestoring", "SSTabRestored", "SSTabClosing"
    ].forEach(function(type) {
      tabutils.addEventListener(gBrowser.mTabContainer, type, this, false);
    }, this);
  },

  handleEvent: function(event) {
    switch (event.type) {
      case "TabOpen": gBrowser.onTabOpen(event.target);break;
      case "TabMove": gBrowser.onTabMove(event.target, event);break;
      case "TabClose": gBrowser.onTabClose(event.target);break;
      case "TabSelect": gBrowser.onTabSelect(event.target);break;
      case "TabBlur": gBrowser.onTabBlur(event.target);break;
      case "TabPinning": gBrowser.onTabPinning(event.target);break;
      case "TabPinned": gBrowser.onTabPinned(event.target);break;
      case "TabHide": gBrowser.onTabHide(event.target);break;
      case "TabShow": gBrowser.onTabShow(event.target);break;
      case "TabStacked": gBrowser.onTabStacked(event.target);break;
      case "TabUnstacked": gBrowser.onTabUnstacked(event.target);break;
      case "StackCollapsed": gBrowser.onStackCollapsed(event.target);break;
      case "StackExpanded": gBrowser.onStackExpanded(event.target);break;
      case "SSTabRestoring": gBrowser.onTabRestoring(event.target);break;
      case "SSTabRestored": gBrowser.onTabRestored(event.target);break;
      case "SSTabClosing": gBrowser.onTabClosing(event.target);break;
    }
  }
};

tabutils._PlacesUtilsExt = function() {
  PlacesUtils.getItemIdForTag = function getItemIdForTag(aTag) {
    var tagId = -1;
    var tagsResultNode = this.getFolderContents(this.tagsFolderId).root;
    for (var i = 0, cc = tagsResultNode.childCount; i < cc; i++) {
      var node = tagsResultNode.getChild(i);
      if (node.title.toLowerCase() == aTag.toLowerCase()) {
        tagId = node.itemId;
        break;
      }
    }
    tagsResultNode.containerOpen = false;
    return tagId;
  };

  PlacesUtils.getItemIdForTaggedURI = function getItemIdForTaggedURI(aURI, aTag) {
    var tagId = this.getItemIdForTag(aTag);
    if (tagId == -1)
      return -1;

    var bookmarkIds = this.bookmarks.getBookmarkIdsForURI(aURI, {});
    for (let bookmarkId of bookmarkIds) {
      if (this.bookmarks.getFolderIdForItem(bookmarkId) == tagId)
        return bookmarkId;
    }
    return -1;
  };

  PlacesUtils.removeTag = function removeTag(aTag) {
    this.tagging.getURIsForTag(aTag).forEach(function(aURI) {
      this.tagging.untagURI(aURI, [aTag]);
    }, this);
  };
};

tabutils._openUILinkInTab = function() {

  //��ҳ
  TU_hookCode("BrowserGoHome", "browser.tabs.loadBookmarksInBackground", "extensions.tabutils.loadHomepageInBackground");

  //��ַ���س���
  TU_hookCode("gURLBar.handleCommand",
    [/((aTriggeringEvent)\s*&&\s*(aTriggeringEvent.altKey))(?![\s\S]*\1)/, "let (newTabPref = TU_getPref('extensions.tabutils.openUrlInTab', true)) ($1 || newTabPref) && !(($2 ? $3 : false) && newTabPref && TU_getPref('extensions.tabutils.invertAlt', true))"],
    [/(?=.*openUILinkIn.*)/, function() {
      params.inBackground = TU_getPref('extensions.tabutils.loadUrlInBackground', false);
      params.disallowInheritPrincipal = !mayInheritPrincipal;
      params.event = aTriggeringEvent || {};
    }],
    [/.*loadURIWithFlags.*(?=[\s\S]*(let params[\s\S]*openUILinkIn.*))/, function(s, s1) s1.replace("where", '"current"')],
    ["aTriggeringEvent.preventDefault();", ""],
    ["aTriggeringEvent.stopPropagation();", ""]
  );
  TU_hookCode("openLinkIn", /(?=let uriObj)/, "w.gURLBar.handleRevert();");

  //�������س���
  if (BrowserSearch.searchBar)
  TU_hookCode("BrowserSearch.searchBar.handleSearchCommand",
    [/(\(aEvent && aEvent.altKey\)) \^ (newTabPref)/, "($1 || $2) && !($1 && $2 && TU_getPref('extensions.tabutils.invertAlt', true))"],
    [/"tab"/, "TU_getPref('extensions.tabutils.loadSearchInBackground', false) ? 'background' : 'foreground'"]
  );

  //�Ҽ������ǩ
  TU_hookCode("BookmarksEventHandler.onClick",
    ["aEvent.button == 2", "$& && (aEvent.ctrlKey || aEvent.altKey || aEvent.metaKey || !TU_getPref('extensions.tabutils.rightClickBookmarks', 0))"],
    ["aEvent.button == 1", "($& || aEvent.button == 2)"],
    ["}", "if (aEvent.button == 2) aEvent.preventDefault();"]
  );
  TU_hookCode("checkForMiddleClick",
    ["event.button == 1", "($& || event.button == 2 && !event.ctrlKey && !event.altKey && !event.metaKey && TU_getPref('extensions.tabutils.rightClickBookmarks', 0))"],
    [/.*closeMenus.*/, "{$&;event.preventDefault();}"]
  );
  TU_hookCode("whereToOpenLink", "e.button == 1", "($& || e.button == 2)");

  //���ֲ˵���
  TU_hookCode("BookmarksEventHandler.onClick", /.*hidePopup.*/, "if (!(TU_getPref('extensions.tabutils.middleClickBookmarks', 0) & 4)) $&");
  TU_hookCode("checkForMiddleClick", /.*closeMenus.*/, "if (!(TU_getPref('extensions.tabutils.middleClickBookmarks', 0) & 4)) $&");

  TU_hookCode.call(document.getElementById("PopupAutoCompleteRichResult"), "onPopupClick",
    ["aEvent.button == 2", "$& && (aEvent.ctrlKey || aEvent.altKey || aEvent.metaKey || !TU_getPref('extensions.tabutils.rightClickBookmarks', 0))"],
    [/.*closePopup[\s\S]*handleEscape.*/, "if (aEvent.button && TU_getPref('extensions.tabutils.middleClickBookmarks', 0) & 4) gBrowser.userTypedValue = null; else {$&}"]
  );

  tabutils.addEventListener(gURLBar.parentNode, "blur", function(event) {
    if (gURLBar.popupOpen && TU_getPref('extensions.tabutils.middleClickBookmarks', 0) & 4) {
      gURLBar._dontBlur = true;
      setTimeout(function() {
        gURLBar.mIgnoreFocus = true;
        gURLBar.focus();
        gURLBar.mIgnoreFocus = false;
        gURLBar._dontBlur = false;
      }, 0);
    }
  }, true);
};

tabutils._openLinkInTab = function() {

  //ǿ�����±�ǩҳ����������
  TU_hookCode("contentAreaClick", /if[^{}]*event.button == 0[^{}]*{([^{}]|{[^{}]*}|{([^{}]|{[^{}]*})*})*(?=})/, "$&" + <![CDATA[
    if (tabutils.gOpenLinkInTab && linkNode.href.substr(0, 11) != "javascript:") {
      openNewTabWith(linkNode.href, linkNode.ownerDocument, null, event, false);
      event.preventDefault();
      return false;
    }
  ]]>);

  TU_hookCode("nsBrowserAccess.prototype.openURI", /(?=switch \(aWhere\))/, function() {
    if (tabutils.gOpenLinkInTab && !isExternal)
      aWhere = Ci.nsIBrowserDOMWindow.OPEN_NEWTAB;
  });

  //ǿ���ں�̨�������±�ǩҳ
  TU_hookCode("gBrowser.loadOneTab", /(?=var owner)/, "bgLoad = bgLoad && !tabutils.gLoadAllInForeground || tabutils.gLoadAllInBackground;");
  TU_hookCode("gBrowser.loadTabs", /(?=var owner)/, "aLoadInBackground = aLoadInBackground && !tabutils.gLoadAllInForeground || tabutils.gLoadAllInBackground;");

  //ǿ�����±�ǩҳ���ⲿ����
  TU_hookCode("contentAreaClick", /if[^{}]*event.button == 0[^{}]*{([^{}]|{[^{}]*}|{([^{}]|{[^{}]*})*})*(?=})/, "$&" + <![CDATA[
    if (/^(https?|ftp)/.test(linkNode.href) && TU_getPref("extensions.tabutils.openExternalInTab", false)) {
      let ourDomain = tabutils.getDomainFromURI(linkNode.ownerDocument.documentURIObject);
      let otherDomain = tabutils.getDomainFromURI(linkNode.href);
      if (ourDomain != otherDomain) {
        openNewTabWith(linkNode.href, linkNode.ownerDocument, null, event, false);
        event.preventDefault();
        return false;
      }
    }
  ]]>);

  //��������
  TU_hookCode("nsBrowserAccess.prototype.openURI", '"browser.link.open_newwindow"', 'isExternal ? "browser.link.open_external" : $&');

  //����������
  TU_hookCode("contentAreaClick", /.*handleLinkClick.*/g, "if (event.button || event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) $&");
  TU_hookCode("handleLinkClick", 'where == "current"', "false");

  //�Ҽ��������
  TU_hookCode("contentAreaClick",
    ["event.button == 2", "$& && (event.ctrlKey || event.altKey || event.metaKey || !TU_getPref('extensions.tabutils.rightClickLinks', 0))"]
  );
  TU_hookCode("handleLinkClick",
    ["event.button == 2", "false"],
    ["event.preventDefault();", 'document.getElementById("contentAreaContextMenu").hidePopup();$&', 'g']
  );
  TU_hookCode("openNewTabWith", "aEvent.button == 1", "($& || aEvent.button == 2)");

  //��ҷ����
  TU_hookCode("handleDroppedLink",
    [/.*loadURI.*/, <![CDATA[{
      let event = arguments[0];
      switch (true) {
        case /\.(xpi|user\.js)$/.test(uri):
        case !TU_getPref("extensions.tabutils.dragAndGo", true):
          $&;break;
        case event.ctrlKey != TU_getPref("extensions.tabutils.invertDrag", false):
          BrowserSearch.loadSearch(name || url, true);break;
        default:
          openNewTabWith(uri, null, postData.value, event, true, event.target.ownerDocument.documentURIObject);break;
      }
    }]]>]
  );

  for (let b of gBrowser.browsers) {
    b.droppedLinkHandler = handleDroppedLink;
  }

  //���±�ǩҳ������ʱ�̳���ʷ
  TU_hookCode("gBrowser.loadOneTab",
    ["{", function() {
      var currentTab = this.mCurrentTab;
    }],
    [/(?=return tab;)/, function() {
      if (aReferrerURI && TU_getPref("extensions.tabutils.openLinkWithHistory", false)) {
        let currentHistory = currentTab.linkedBrowser.sessionHistory;
        let newHistory = tab.linkedBrowser.sessionHistory.QueryInterface(Ci.nsISHistoryInternal);
        for (let i = 0; i <= currentHistory.index; i++) {
          newHistory.addEntry(currentHistory.getEntryAtIndex(i, false), true);
        }
      }
    }]
  );
};

//������ģʽ
tabutils._singleWindowMode = function() {
  if (TU_getPref("extensions.tabutils.singleWindowMode", false)) {
    var win = (function() {
      var winEnum = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getZOrderDOMWindowEnumerator("navigator:browser", true);
      while (winEnum.hasMoreElements()) {
        var win = winEnum.getNext();
        if (win != window && win.toolbar.visible)
          return win;
      }
    })();

    if (win) {
      TU_hookFunc((gBrowserInit.onLoad + gBrowserInit._delayedStartup).toString().match(/^.*{|if \(uriToLoad.*{([^{}]|{[^{}]*}|{([^{}]|{[^{}]*})*})*}|}$/g).join("\n"), // Bug 756313 [Fx19]
        ["{", "var uriToLoad = window.arguments && window.arguments[0];"],
        ["gBrowser.loadTabs(specs, false, true);", "this.gBrowser.loadTabs(specs, false, false);"],
        ["loadOneOrMoreURIs(uriToLoad);", "this.gBrowser.loadTabs(uriToLoad.split('|'), false, false);"],
        [/.*loadURI.*\n.*/, "this.gBrowser.loadOneTab(uriToLoad, window.arguments[2], window.arguments[1] && window.arguments[1].split('=')[1], window.arguments[3] || null, false, window.arguments[4] || false);"],
        [/.*swapBrowsersAndCloseOther.*/, "return;"],
        ["}", "if (uriToLoad) window.close();"]
      ).apply(win);
    }
  }

  tabutils._tabPrefObserver.singleWindowMode = function() {
    if (TU_getPref("extensions.tabutils.singleWindowMode", false)) {
      if (TU_getPref("browser.link.open_external", 3) == 2)
        TU_setPref("browser.link.open_external", 3);
      if (TU_getPref("browser.link.open_newwindow") == 2)
        TU_setPref("browser.link.open_newwindow", 3);
      if (TU_getPref("browser.link.open_newwindow.override.external") == 2) // Bug 509664 [Fx10]
        TU_setPref("browser.link.open_newwindow.override.external", 3);
      if (TU_getPref("browser.link.open_newwindow.restriction") != 0)
        TU_setPref("browser.link.open_newwindow.restriction", 0);
    }
  };

  TU_hookCode("OpenBrowserWindow", "{", function() {
    if (TU_getPref("extensions.tabutils.singleWindowMode", false))
      return BrowserOpenTab() || gBrowser.getLastOpenedTab();
  });

  TU_hookCode("undoCloseWindow", "{", function() {
    if (TU_getPref("extensions.tabutils.singleWindowMode", false))
      return undoCloseTab(aIndex);
  });

  TU_hookCode("openNewWindowWith", "{", function() {
    if (TU_getPref("extensions.tabutils.singleWindowMode", false))
      return openNewTabWith(aURL, aDocument, aPostData, null, aAllowThirdPartyFixup, aReferrer);
  });

  TU_hookCode("openLinkIn", /(?=.*getTopWin.*)/, function() {
    if (where == "window" && TU_getPref("extensions.tabutils.singleWindowMode", false))
      where = "tab";
  });

  TU_hookCode("nsBrowserAccess.prototype.openURI", /(?=switch \(aWhere\))/, function() {
    if (aWhere == Ci.nsIBrowserDOMWindow.OPEN_NEWWINDOW && TU_getPref("extensions.tabutils.singleWindowMode", false))
      aWhere = Ci.nsIBrowserDOMWindow.OPEN_NEWTAB;
  });

  TU_hookCode("gBrowser.replaceTabWithWindow", "{", function() {
    if (["_onDragEnd", "onxbldragend"].indexOf(arguments.callee.caller.name) > -1 && TU_getPref("extensions.tabutils.singleWindowMode", false))
      return null;
  });

  tabutils.addEventListener(window, "popupshown", function(event) {
    var singleWindowMode = TU_getPref("extensions.tabutils.singleWindowMode", false);
    [
      "menu_newNavigator",
      "historyUndoWindowMenu",
      "context-openlink",
      "context-openframe",
      "placesContext_open:newwindow"
    ].forEach(function(aId) {
      var item = event.originalTarget.getElementsByAttribute("id", aId)[0];
      if (item)
        item.setAttribute("disabled", singleWindowMode);
    });
  }, false);
};

tabutils._tabOpeningOptions = function() {

  //�½���ǩҳʱ�������пհױ�ǩҳ
  TU_hookCode("nsBrowserAccess.prototype.openURI", "fromExternal: isExternal", "$&, reuseBlank: true");
  TU_hookCode("gBrowser.loadOneTab",
    ["{", "var lastArg = Object(arguments[arguments.length - 1]);"],
    ["fromExternal: aFromExternal", "$&, reuseBlank: lastArg.reuseBlank"]
  );
  TU_hookCode("gBrowser.addTab",
    ["{", "var lastArg = Object(arguments[arguments.length - 1]);"],
    [/if \(arguments.length == 2[^{}]*\) {[^{}]*}/, "$&" + <![CDATA[
      if (lastArg.reuseBlank == null ? !isBlankPageURL(aURI) : lastArg.reuseBlank) {
        var t = this.getBlankTab();
        if (t) {
          var b = this.getBrowserForTab(t);
          return t;
        }
      }
    ]]>],
    [/(?=return t;)/, gBrowser.addTab.toString().match(/var (uriIsBlankPage|uriIsNotAboutBlank).*|if \(uriIsNotAboutBlank\) {([^{}]|{[^{}]*})*}/g).join("\n")] // Bug 716108 [Fx16]
  );

  gBrowser.getBlankTab = function getBlankTab() {
    var reuseBlank = TU_getPref("extensions.tabutils.reuseBlank", 1);
    return reuseBlank & 1 && this.isBlankTab(this.mCurrentTab) ? this.mCurrentTab :
           reuseBlank & 2 && this.isBlankTab(this.mTabContainer.lastChild) ? this.mTabContainer.lastChild :
           reuseBlank & 4 ? this.getFirstBlankTabBut() : null;
  };

  gBrowser.getFirstBlankTabBut = function getFirstBlankTabBut(aTab) {
    for (let tab of this.mTabs) {
      if (tab != aTab && this.isBlankTab(tab))
        return tab;
    }
  };

  gBrowser.isBlankTab = function isBlankTab(aTab) {
    return this.isBlankBrowser(aTab.linkedBrowser)
        && ["busy", "pending", "ontap", "hidden", "removing"].every(function(aAttr) !aTab.hasAttribute(aAttr));
  };

  gBrowser.isBlankBrowser = function isBlankBrowser(aBrowser) {
    return (!aBrowser.currentURI || isBlankPageURL(aBrowser.currentURI.spec))
        && (!aBrowser.sessionHistory || aBrowser.sessionHistory.count < 2)
        && (!aBrowser.webProgress || !aBrowser.webProgress.isLoadingDocument);
  };
  TU_hookCode("isBlankPageURL", 'aURL == "about:blank"', "gInitialPages.indexOf(aURL) > -1");

  //�Զ��رշ������򿪵Ŀհױ�ǩҳ
  TU_hookCode("gBrowser.mTabProgressListener", /(?=var location)/, function() {
    if (aWebProgress.DOMWindow.document.documentURI == "about:blank"
        && aRequest.QueryInterface(nsIChannel).URI.spec != "about:blank"
        && aStatus == 0
        && TU_getPref("extensions.tabutils.removeUnintentionalBlank", true)) {
      let win = aWebProgress.DOMWindow;
      win._closeTimer = win.setTimeout(function(self) {
        self.mTabBrowser.isBlankTab(self.mTab) && self.mTabBrowser.removeTab(self.mTab);
      }, 250, this);
    }
  });

  //�ڵ�ǰ��ǩҳ���Ҳ���±�ǩҳ
  //�����򿪺�̨��ǩʱ����ԭ��˳��
  TU_hookCode("gBrowser.addTab",
    [/\S*insertRelatedAfterCurrent\S*(?=\))/, "false"],
    [/(?=(return t;)(?![\s\S]*\1))/, function() {
      if (t.hasAttribute("opener")) {
        function shouldStack(tab) let (args = tab.arguments) (args.aReferrerURI || args.aRelatedToCurrent && args.aURI != "about:blank");

        let lastRelatedTab = this.mCurrentTab;
        let isStack = lastRelatedTab.hasAttribute("group") && lastRelatedTab.getAttribute("group-counter") != 1;
        let willStack = (isStack || TU_getPref("extensions.tabutils.autoStack", false)) && shouldStack(t);
        if (isStack && !willStack)
          lastRelatedTab = this.lastSiblingTabOf(lastRelatedTab);

        if (TU_getPref("extensions.tabutils.openTabNext.keepOrder", true)) {
          let tab = lastRelatedTab.nextSibling;
          let panelId = this.mCurrentTab.linkedPanel;
          for (; tab && tab.hasAttribute("pinned"); tab = tab.nextSibling);
          for (; tab && tab.getAttribute("opener") == panelId && tab != t && (!willStack || shouldStack(tab)); tab = tab.nextSibling)
            lastRelatedTab = tab;
        }

        if (willStack)
          this.attachTabTo(t, lastRelatedTab, {move: true, expand: true});
        this.moveTabTo(t, t._tPos > lastRelatedTab._tPos ? lastRelatedTab._tPos + 1 : lastRelatedTab._tPos);
      }
    }]
  );

  TU_hookCode("gBrowser.onTabOpen", "}", function() {
    if ((function() {
      switch (TU_getPref("extensions.tabutils.openTabNext", 1)) {
        case 1: //All
        case 2: return aRelatedToCurrent || aReferrerURI || aURI != "about:blank"; //All but New Tab
        case 3: return aRelatedToCurrent == null ? aReferrerURI : aRelatedToCurrent; //None but Links
        default: return false; //None
      }
    })()) {
      aTab.setAttribute("opener", this.mCurrentTab.linkedPanel);
    }
  });

  TU_hookCode("gBrowser.onTabPinned", "}", function() {
    aTab.removeAttribute("opener");
  });

  //�½���ǩҳ
  if (BrowserOpenTab.name == "BrowserOpenTab") { //Compatibility with Speed Dial
    TU_hookCode("BrowserOpenTab",
      [/.*openUILinkIn\((.*)\)/, function(s, s1) s.replace(s1, (
        s1 = s1.split(","),
        s1.push("{inBackground: TU_getPref('extensions.tabutils.loadNewInBackground', false)}"),
        s1.push("{relatedToCurrent: TU_getPref('extensions.tabutils.openTabNext', 1) == 1}"),
        s1.join().replace("},{", ",")
      ))] // Bug 490225 [Fx11]
    );
  }
  TU_hookCode("isBlankPageURL", "aURL == BROWSER_NEW_TAB_URL", "$& && TU_getPref('extensions.tabutils.markNewAsBlank', true)");
  TU_hookCode("gBrowser._beginRemoveTab", /.*addTab.*/, "BrowserOpenTab();");
  TU_hookCode("gBrowser._endRemoveTab", /.*addTab.*/, "BrowserOpenTab();");

  gBrowser.getLastOpenedTab = function getLastOpenedTab() {
    return this.mTabContainer.getElementsByAttribute("linkedpanel", this.mPanelContainer.lastChild.id)[0];
  };

  //���Ʊ�ǩҳ
  TU_hookCode("gBrowser.duplicateTab",
    [/return/g, "var tab ="],
    ["}", function() {
      this.detachTab(tab, true);
      if (["_onDrop", "onxbldrop", "duplicateTabIn"].indexOf(arguments.callee.caller.name) == -1) {
        if (TU_getPref("extensions.tabutils.openDuplicateNext", true)) {
          if (aTab.hasAttribute("group") && aTab.getAttribute("group-counter") != 1 ||
              TU_getPref("extensions.tabutils.autoStack", false))
            this.attachTabTo(tab, aTab, {move: true, expand: true});
          this.moveTabTo(tab, tab._tPos > aTab._tPos ? aTab._tPos + 1 : aTab._tPos);
        }
        if (!tabutils.gLoadAllInBackground && !TU_getPref("extensions.tabutils.loadDuplicateInBackground", false))
          this.selectedTab = tab;
      }
      return tab;
    }]
  );

  //�����رձ�ǩҳ
//  TU_hookCode("gBrowser.moveTabTo", "{", function() {
//    if (arguments.callee.caller.name == "ssi_undoCloseTab"
//        && !TU_getPref("extensions.tabutils.restoreOriginalPosition", true))
//      return;
//  });
};

tabutils._tabClosingOptions = function() {

  //�رձ�ǩҳʱѡ�����/�Ҳ�/��һ��/���һ����ǩ
  TU_hookCode("gBrowser._beginRemoveTab", "{", "aTab.setAttribute('removing', true);");
  gBrowser._tabsToSelect = function _tabsToSelect(aTab) {
    if (!aTab)
      aTab = this.mCurrentTab;

    var seenTabs = [];
    seenTabs[aTab._tPos] = true;

    var selectOnClose = TU_getPref("extensions.tabutils.selectOnClose", 0);
    if (selectOnClose & 0x80) for (let tab of _tabs_(0x80)) yield tab;
    if (selectOnClose & 0x40) for (let tab of _tabs_(0x40)) yield tab;
    if (selectOnClose & 0x20) for (let tab of _tabs_(0x20)) yield tab;
    if (selectOnClose & 0x03) for (let tab of _tabs_(selectOnClose & 0x03)) yield tab;
    if (selectOnClose & 0x1c) for (let tab of _tabs_(selectOnClose & 0x1c)) yield tab;

    function _tabs_(selectOnClose) {
      for (let tab of __tabs__(selectOnClose)) {
        if (!tab.hidden && !tab.disabled && !tab.hasAttribute("removing") && !(tab._tPos in seenTabs)) {
          seenTabs[tab._tPos] = true;
          yield tab;
        }
      }
    }

    function __tabs__(selectOnClose) {
      var tabs = gBrowser.mTabs;
      switch (selectOnClose) {
        case 1: //Left
          for (let i = aTab._tPos - 1; i >= 0; i--) yield tabs[i];
          break;
        case 2: //Right
          for (let i = aTab._tPos + 1; i < tabs.length; i++) yield tabs[i];
          break;
        case 4: //First
          for (let i = 0; i < tabs.length; i++) yield tabs[i];
          break;
        case 8: //Last
          for (let i = tabs.length - 1; i >= 0; i--) yield tabs[i];
          break;
        case 0x10: //Last selected
          var tabHistory = gBrowser.mTabContainer._tabHistory;
          for (let i = tabHistory.length - 1; i >= 0; i--) yield tabHistory[i];
          break;
        case 0x20: //Unread
          for (let tab of __tabs__()) if (tab.getAttribute("unread") == "true") yield tab;
          break;
        case 0x40: //Related
          for (let tab of __tabs__()) if (gBrowser.isRelatedTab(tab, aTab)) yield tab;
          break;
        case 0x80: //Unread Related
          for (let tab of __tabs__(0x20)) if (gBrowser.isRelatedTab(tab, aTab)) yield tab;
          break;
        case undefined: //Right or Rightmost
          for (let i = aTab._tPos + 1; i < tabs.length; i++) yield tabs[i];
          for (let i = aTab._tPos - 1; i >= 0; i--) yield tabs[i];
          break;
      }
    }
  };

  gBrowser._blurTab = function _blurTab(aTab) {
    if (aTab != this.mCurrentTab)
      return this.mCurrentTab;

    try {
      return this.selectedTab = this._tabsToSelect().next();
    }
    catch (e) {
      if (this.selectedTab = this.getLastSelectedTab())
        return this.selectedTab;

      if (this.selectedTab = this.getLastSelectedTab(1, true)) { //Fx 4.0
        TabView.show(); //Bug 651440, 654311, 663421(Fx7)
        return this.selectedTab;
      }
      return this.selectedTab = BrowserOpenTab() || gBrowser.getLastOpenedTab();
    }
  };

  //�رձ�ǩҳʱѡ��������ǩ
  TU_hookCode("gBrowser.onTabSelect", "}", function() {
    var panelId = aTab.linkedPanel;
    Array.forEach(this.mTabs, function(aTab) {
      if (aTab.getAttribute("opener").startsWith(panelId))
        aTab.setAttribute("opener", panelId + (+aTab.getAttribute("opener").slice(panelId.length) + 1));
    });
  });

  TU_hookCode("gBrowser.onTabClose", "}", function() {
    if (aTab.hasAttribute("opener")) {
      let opener = aTab.getAttribute("opener");
      let panelId = aTab.linkedPanel;
      Array.forEach(this.mTabs, function(aTab) {
        if (aTab.getAttribute("opener").startsWith(panelId))
          aTab.setAttribute("opener", opener);
      });
    }
  });

  TU_hookCode("gBrowser.loadTabs", "}", function() {
    if (aURIs.length > 1)
      this.updateCurrentBrowser(true);
  });

  gBrowser.isRelatedTab = function isRelatedTab(aTab, bTab) {
    if (!bTab)
      bTab = this.mCurrentTab;

    return aTab.hasAttribute("opener") && aTab.getAttribute("opener") == bTab.getAttribute("opener")
        || aTab.getAttribute("opener").startsWith(bTab.linkedPanel)
        || bTab.getAttribute("opener").startsWith(aTab.linkedPanel);
  };

  //�رձ�ǩҳʱѡ��δ����ǩ
  //TU_hookCode("gBrowser.mTabProgressListener", /(?=var location)/, 'this.mTab.setAttribute("unread", !this.mTab.selected);');
  //TU_hookCode("gBrowser.onTabSelect", "}", 'aTab.removeAttribute("unread");');

  //�رձ�ǩҳʱѡ���ϴ�����ı�ǩ
  gBrowser.mTabContainer._tabHistory = Array.slice(gBrowser.mTabs);
  TU_hookCode("gBrowser.onTabOpen", "}", function() {
    var tabHistory = this.mTabContainer._tabHistory;
    if (aTab.hasAttribute("opener")) {
      let index = tabHistory.lastIndexOf(this.mCurrentTab);
      while (index > 0 && tabHistory[index - 1].getAttribute("opener") == aTab.getAttribute("opener"))
        index--;
      tabHistory.splice(index, 0, aTab);
    }
    else
      tabHistory.unshift(aTab);
  });

  TU_hookCode("gBrowser.onTabSelect", "}", function() {
    var tabHistory = this.mTabContainer._tabHistory;
    tabHistory.splice(tabHistory.lastIndexOf(aTab), 1);
    tabHistory.push(aTab);
  });

  TU_hookCode("gBrowser.onTabClose", "}", function() {
    var tabHistory = this.mTabContainer._tabHistory;
    tabHistory.splice(tabHistory.lastIndexOf(aTab), 1);
  });

  gBrowser.getLastSelectedTab = function getLastSelectedTab(aDir, aIgnoreHidden, aIgnoreDisabled) {
    var tabHistory = this.mTabContainer._tabHistory;
    var index = tabHistory.lastIndexOf(this.mCurrentTab);
    for (var i = (index > -1); i < tabHistory.length; i++) {
      var tab = tabHistory[index = aDir < 0 ? index + 1 : index - 1]
             || tabHistory[index = aDir < 0 ? 0 : tabHistory.length - 1];
      if ((aIgnoreHidden || !tab.hidden) && (aIgnoreDisabled || !tab.disabled) && !tab.hasAttribute("removing"))
        return tab;
    }
  };

  //Ctrl+Tab�л����ϴ�����ı�ǩ
  //Ctrl+���ҷ�����л���ǰһ��/��һ����ǩ
  tabutils.addEventListener(window, "keypress", function(event) {
    if (!event.ctrlKey || event.altKey || event.metaKey)
      return;

    switch (true) {
      case event.keyCode == event.DOM_VK_TAB:
        if (TU_getPref("extensions.tabutils.handleCtrlTab", true)) {
          if (!gBrowser._previewMode && TU_getPref("extensions.tabutils.handleCtrl", true))
            gBrowser._previewMode = true;

          gBrowser.selectedTab = gBrowser.getLastSelectedTab(event.shiftKey ? -1 : 1);
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      case event.keyCode == event.DOM_VK_LEFT && !event.shiftKey:
      case event.keyCode == event.DOM_VK_RIGHT && !event.shiftKey:
        if (TU_getPref("extensions.tabutils.handleCtrlArrow", true)) {
          if (!gBrowser._previewMode && TU_getPref("extensions.tabutils.handleCtrl", true))
            gBrowser._previewMode = true;

          let rtl = getComputedStyle(gBrowser.mTabContainer, null).direction == "rtl";
          gBrowser.mTabContainer.advanceSelectedTab(event.keyCode == event.DOM_VK_LEFT ^ rtl ? -1 : 1, true);
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      case event.keyCode == event.DOM_VK_PAGE_UP && !event.shiftKey:
      case event.keyCode == event.DOM_VK_PAGE_DOWN && !event.shiftKey:
        if (!gBrowser._previewMode && TU_getPref("extensions.tabutils.handleCtrl", true))
          gBrowser._previewMode = true;
        break;
      default:
        if (gBrowser._previewMode) {
          gBrowser._previewMode = false;
          gBrowser.updateCurrentBrowser(true);
        }
        break;
    }
  }, true);

  tabutils.addEventListener(window, "keyup", function(event) {
    switch (event.keyCode) {
      case event.DOM_VK_CONTROL:
        if (gBrowser._previewMode) {
          gBrowser._previewMode = false;
          gBrowser.updateCurrentBrowser(true);
        }
        break;
      case event.DOM_VK_LEFT:
      case event.DOM_VK_RIGHT:
        if (event.ctrlKey && TU_getPref("extensions.tabutils.handleCtrlArrow", true))
          event.stopPropagation();
    }
  }, true);

  tabutils.addEventListener(window, "keydown", function(event) {
    switch (event.keyCode) {
      case event.DOM_VK_LEFT:
      case event.DOM_VK_RIGHT:
        if (event.ctrlKey && TU_getPref("extensions.tabutils.handleCtrlArrow", true))
          event.stopPropagation();
    }
  }, true);

  TU_hookCode("gBrowser.updateCurrentBrowser", /.*dispatchEvent[\s\S]*_tabAttrModified.*/, "$&};if (window.windowState != window.STATE_MINIMIZED) {");

  //Don't close the last primary window with the las tab
  TU_hookCode("gBrowser._beginRemoveTab", /\S*closeWindowWithLastTab\S*(?=;)/, <![CDATA[ //Bug 607893
    $& && (TU_getPref("extensions.tabutils.closeLastWindowWithLastTab", false) || function() {
      var winEnum = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getEnumerator("navigator:browser");
      while (winEnum.hasMoreElements()) {
        var win = winEnum.getNext();
        if (win != window && win.toolbar.visible)
          return win;
      }
    }())
  ]]>);

  //Don't resize tabs until mouse leaves the tab bar
  gBrowser.mTabContainer.__defineGetter__("_tabSizingRule", function() { //Bug 465086 (Fx5), 649654
    delete this._tabSizingRule;
    return this._tabSizingRule = tabutils.insertRule('.tabbrowser-tabs[dontresize] > .tabbrowser-tab:not([pinned]):not([faviconized]) {}');
  });

  gBrowser.mTabContainer._lockTabSizing = function() {};
  gBrowser.mTabContainer._unlockTabSizing = function() {};

  gBrowser.mTabContainer._revertTabSizing = function _revertTabSizing() {
    if (!this._tabSizingLocked)
      return;

    if (this._tabSizingLocked == 1) {
      this._tabSizingLocked = false;
      return;
    }

    this.mTabstrip._scrollbox.style.maxWidth = "";
    this.mTabstrip._spacer.style.minWidth = "";
    this.removeAttribute("dontresize");
    this._tabSizingLocked = false;

    if (this.hasAttribute("overflow") && this.mTabstrip._scrollbox.scrollWidth <= this.mTabstrip._scrollbox.clientWidth) {
      let evt = document.createEvent("UIEvent");
      evt.initUIEvent("underflow", true, false, window, 1);
      this.mTabstrip._scrollbox.dispatchEvent(evt);
    }
    this.adjustTabstrip();
    this._fillTrailingGap();
  };

  tabutils.addEventListener(gBrowser.mTabContainer, 'mouseover', function(event) {
    if (this._tabSizingLocked || this.hasAttribute("multirow") || this.orient == "vertical"
        || event.target.localName != "tab" || event.target.hasAttribute("pinned")
        || !TU_getPref("extensions.tabutils.delayResizing", true))
      return;

    this._tabSizingLocked = true;
    window.addEventListener('mousemove', function(event) {
      let boxObject = gBrowser.mTabContainer.boxObject;
      if (event.screenY < boxObject.screenY - boxObject.height * 0.5 || event.screenY > boxObject.screenY + boxObject.height * 1.5) {
        window.removeEventListener('mousemove', arguments.callee, false);
        gBrowser.mTabContainer._revertTabSizing();
      }
    }, false);
  }, false);

  tabutils.addEventListener(gBrowser.mTabContainer, 'TabClose', function(event) {
    if (!this._tabSizingLocked || event.target.hasAttribute("pinned"))
      return;

    if (this._tabSizingLocked == 1) {
      this.mTabstrip._scrollbox.style.maxWidth = this.mTabstrip._scrollbox.clientWidth + "px";
      this._tabSizingLocked++;
    }

    let tab = event.target;
    let visibleTabs = Array.filter(this.childNodes, function(aTab) aTab.boxObject.width > 0);
    let flexibleTabs = Array.filter(visibleTabs, function(aTab) getComputedStyle(aTab, null).MozBoxFlex > 0);
    if (flexibleTabs.length == 0)
      return;

    if (tab == visibleTabs[visibleTabs.length - 1] || tab == flexibleTabs[flexibleTabs.length - 1]) {
      if (this.hasAttribute("dontresize")) {
        let spacer = this.mTabstrip._spacer;
        spacer.style.MozBoxFlex = 100;
        spacer.style.minWidth = getComputedStyle(spacer, null).width;
        spacer.style.MozBoxFlex = "";

        this.setAttribute("dontanimate", true);
        this.removeAttribute("dontresize");this.clientTop; //Bug 649247
        this.setAttribute("dontanimate", !TU_getPref("browser.tabs.animate"));
      }
      return;
    }

    if (!this.hasAttribute("dontresize")) {
      let width = flexibleTabs[0].getBoundingClientRect().width;
      this._tabSizingRule.style.setProperty("max-width", width + "px", "important");
      this._tabSizingRule.style.setProperty("min-width", width + "px", "important");

      this.setAttribute("dontanimate", true);
      this.setAttribute("dontresize", true);this.clientTop;
      this.setAttribute("dontanimate", !TU_getPref("browser.tabs.animate"));
    }

    let scrollbox = this.mTabstrip._scrollbox;
    if (scrollbox.scrollLeft > 0) {
      let spacer = this.mTabstrip._spacer;
      let width = parseFloat(spacer.style.minWidth || 0);
      width += tab.getBoundingClientRect().width;
      width -= scrollbox.scrollWidth - scrollbox.scrollLeft - scrollbox.clientWidth;
      spacer.style.minWidth = width + "px";
    }
  }, false);

  tabutils.addEventListener(gBrowser.mTabContainer, 'TabOpen', function(event) {
    if (this._tabSizingLocked)
      this._revertTabSizing();
  }, false);

  tabutils.addEventListener(gBrowser.mTabContainer, 'underflow', function(event) {
    if (this._tabSizingLocked > 1) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
};

//���δ����ǩҳ
tabutils._unreadTab = function() {
  gBrowser.unreadTab = function unreadTab(aTab, aForce) {
    if (aForce == null)
      aForce = aTab.getAttribute("unread") != "true";

    if (aForce && !aTab.selected) {
      tabutils.setAttribute(aTab, "unread", true);
      aTab.setAttribute("rotate", aTab.getAttribute("rotate") != "true");
    }
    else {
      tabutils.removeAttribute(aTab, "unread");
      aTab.removeAttribute("rotate");
    }
  };

  TU_hookCode("gBrowser.onTabRestoring", "}", function() {
    this.unreadTab(aTab, ss.getTabValue(aTab, "unread") == "true");
  });

  TU_hookCode("gBrowser.onTabOpen", "}", function() {
    this.unreadTab(aTab, true);
  });

  TU_hookCode("gBrowser.onTabSelect", "}", function() {
    this.unreadTab(aTab, false);
  });

  TU_hookCode("gBrowser.setTabTitle", /(?=aTab.label = title;)/, function() {
    if (!aTab.hasAttribute("busy") && !aTab.hasAttribute("restoring"))
      this.unreadTab(aTab, true);
  });

  TU_hookCode("gBrowser.mTabProgressListener", 'this.mTab.setAttribute("unread", "true");', ";"); //Fx 9.0+
  TU_hookCode("gBrowser.mTabProgressListener", 'this.mTab.removeAttribute("busy");', <![CDATA[ //__SS_restoreState, __SS_data._tabStillLoading
    if (this.mTab.hasAttribute("busy") && !this.mTab.hasAttribute("restoring"))
      this.mTabBrowser.unreadTab(this.mTab, true);
    $&
  ]]>);
}

//������ǩҳ��������ǩҳ�������ǩҳ
tabutils._protectAndLockTab = function() {
  gBrowser.protectTab = function protectTab(aTab, aForce, aRestoring) {
    if (aTab.hasAttribute("protected") && aForce != true) {
      tabutils.removeAttribute(aTab, "protected");
      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled) {
        PlacesUtils.tagging.untagURI(aTab.linkedBrowser.currentURI, ["protected"]);
      }
      this.mTabContainer.adjustTabstrip(aTab.hasAttribute("pinned"));
    }
    else if (!aTab.hasAttribute("protected") && aForce != false) {
      tabutils.setAttribute(aTab, "protected", true);
      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled && TU_getPref("extensions.tabutils.autoProtect", true)) {
        PlacesUtils.tagging.tagURI(aTab.linkedBrowser.currentURI, ["protected"]);
      }
      this.mTabContainer.adjustTabstrip(aTab.hasAttribute("pinned"));
    }
  };

  gBrowser.lockTab = function lockTab(aTab, aForce, aRestoring) {
    if (aTab.hasAttribute("locked") && aForce != true) {
      tabutils.removeAttribute(aTab, "locked");
      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled) {
        PlacesUtils.tagging.untagURI(aTab.linkedBrowser.currentURI, ["locked"]);
      }
    }
    else if (!aTab.hasAttribute("locked") && aForce != false) {
      tabutils.setAttribute(aTab, "locked", true);
      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled && TU_getPref("extensions.tabutils.autoLock", true)) {
        PlacesUtils.tagging.tagURI(aTab.linkedBrowser.currentURI, ["locked"]);
      }
    }
  };

  gBrowser.freezeTab = function freezeTab(aTab, aForce) {
    if ((!aTab.hasAttribute("protected") || !aTab.hasAttribute("locked")) && aForce != false) {
      this.protectTab(aTab, true);
      this.lockTab(aTab, true);
    }
    else if ((aTab.hasAttribute("protected") || aTab.hasAttribute("locked")) && aForce != true) {
      this.protectTab(aTab, false);
      this.lockTab(aTab, false);
    }
  };

  TU_hookCode("gBrowser.onTabRestoring", "}", function() {
    this.protectTab(aTab, ss.getTabValue(aTab, "protected") == "true", true);
    this.lockTab(aTab, ss.getTabValue(aTab, "locked") == "true", true);
  });

  gBrowser.autoProtectTab = function autoProtectTab(aTab, aURI, aTags) {
    if (!aTab.hasAttribute("protected") && aTags.indexOf("protected") > -1 && TU_getPref("extensions.tabutils.autoProtect", true))
      this.protectTab(aTab, true, true);
  };

  gBrowser.autoLockTab = function autoLockTab(aTab, aURI, aTags) {
    if (aURI.spec != "about:blank" && TU_getPref("extensions.tabutils.autoLock", true)) {
      let locked = tabutils.getURIsForTag("locked").some(function(bURI) aURI.spec.startsWith(bURI.spec));
      this.lockTab(aTab, locked, true);
    }
  };

  TU_hookCode("gBrowser.onTabOpen", "}", "this.autoProtectTab(aTab, uri, tags);this.autoLockTab(aTab, uri, tags);");
  TU_hookCode("gBrowser.onLocationChange", "}", "this.autoProtectTab(aTab, uri, tags);this.autoLockTab(aTab, uri, tags);");

  TU_hookCode("gBrowser.removeTab", "{", function() {
    if (aTab.hasAttribute("protected") || aTab.hasAttribute("pinned") && TU_getPref("extensions.tabutils.pinTab.autoProtect", false))
      return;
  });
  TU_hookCode("gBrowser.createTooltip", /(tab|tn).mOverCloseButton/, "$& && !$1.hasAttribute('protected')");

  TU_hookCode("gBrowser.loadURI", "{", function() {
    let locked = this.mCurrentTab.hasAttribute("locked")
              || this.mCurrentTab.hasAttribute("pinned") && TU_getPref("extensions.tabutils.pinTab.autoLock", false);
    if (locked && aURI.substr(0, 11) != "javascript:")
      return this.loadOneTab(aURI, aReferrerURI, aCharset, null, null, false);
  });

  TU_hookCode("gBrowser.loadURIWithFlags", "{", function() {
    let locked = this.mCurrentTab.hasAttribute("locked")
              || this.mCurrentTab.hasAttribute("pinned") && TU_getPref("extensions.tabutils.pinTab.autoLock", false);
    if (locked && aURI.substr(0, 11) != "javascript:")
      return this.loadOneTab(aURI, aReferrerURI, aCharset, aPostData, null, aFlags & Ci.nsIWebNavigation.LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP);
  });

  TU_hookCode("contentAreaClick", /if[^{}]*event.button == 0[^{}]*{([^{}]|{[^{}]*}|{([^{}]|{[^{}]*})*})*(?=})/, "$&" + <![CDATA[
    let locked = gBrowser.mCurrentTab.hasAttribute("locked")
              || gBrowser.mCurrentTab.hasAttribute("pinned") && TU_getPref("extensions.tabutils.pinTab.autoLock", false);
    if (locked && linkNode.href.substr(0, 11) != "javascript:") {
      openNewTabWith(linkNode.href, linkNode.ownerDocument, null, event, false);
      event.preventDefault();
      return false;
    }
  ]]>);
};

//ͼ�껯��ǩҳ
tabutils._faviconizeTab = function() {
  gBrowser.faviconizeTab = function faviconizeTab(aTab, aForce, aRestoring) {
    if (aTab.hasAttribute("faviconized") && aForce != true) {
      tabutils.removeAttribute(aTab, "faviconized");
      tabutils.setTabValue(aTab, "faviconized", false); //for pinned but not iconified tabs
      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled) {
        PlacesUtils.tagging.untagURI(aTab.linkedBrowser.currentURI, ["faviconized"]);
      }
      this.mTabContainer.adjustTabstrip(aTab.hasAttribute("pinned"));
    }
    else if (!aTab.hasAttribute("faviconized") && aForce != false) {
      tabutils.setAttribute(aTab, "faviconized", true);
      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled && TU_getPref("extensions.tabutils.autoFaviconize", true)) {
        PlacesUtils.tagging.tagURI(aTab.linkedBrowser.currentURI, ["faviconized"]);
      }
      this.mTabContainer.adjustTabstrip(aTab.hasAttribute("pinned"));
    }
  };

  TU_hookCode("gBrowser.onTabRestoring", "}", function() {
    this.faviconizeTab(aTab, ss.getTabValue(aTab, "faviconized") == "true" ||
                             ss.getTabValue(aTab, "faviconized") != "false" && tabutils.getTabValue(aTab, "pinned") == "true", true);
  });

  gBrowser.autoFaviconizeTab = function autoFaviconizeTab(aTab, aURI, aTags) {
    if (this.mTabContainer.orient == "horizontal" && !aTab.hasAttribute("pinned") && aURI.spec != "about:blank" && TU_getPref("extensions.tabutils.autoFaviconize", true)) {
      let faviconized = tabutils.getURIsForTag("faviconized").some(function(bURI) aURI.spec.startsWith(bURI.spec));
      this.faviconizeTab(aTab, faviconized, true);
    }
  };

  TU_hookCode("gBrowser.onTabOpen", "}", "this.autoFaviconizeTab(aTab, uri, tags);");
  TU_hookCode("gBrowser.onLocationChange", "}", "this.autoFaviconizeTab(aTab, uri, tags);");
};

//�̶���ǩҳ
tabutils._pinTab = function() {
  gBrowser.pinTab = function pinTab(aTab, aForce, aBookmarkId, aRestoring) {
    if (!arguments.callee.caller || ["ssi_restoreWindow", "ssi_restoreHistoryPrecursor"].indexOf(arguments.callee.caller.name) > -1)
      aForce = aRestoring = true;

    if (aTab.hasAttribute("pinned") && aForce != true) {
      aTab.setAttribute("fadein", true);
      tabutils.removeAttribute(aTab, "pinned");

      if (!aRestoring)
        this.faviconizeTab(aTab, false, true);

      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled) {
        let uri = aTab.linkedBrowser.currentURI;
        try {
          uri = PlacesUtils.bookmarks.getBookmarkURI(aTab.bookmarkId);
        }
        catch (e) {}

        PlacesUtils.tagging.untagURI(uri, ["pinned"]);
        this.updatePinnedTabsBar();
      }
      aTab.bookmarkId = null;
      tabutils.deleteTabValue(aTab, "bookmarkId");
      tabutils.dispatchEvent(aTab, "TabUnpinning", true, false);

      this.mTabContainer.positionPinnedTab(aTab);
      this.mTabContainer.positionPinnedTabs();
      this.mTabContainer.adjustTabstrip();

      aTab.linkedBrowser.docShell.isAppTab = false;
      if (aTab.selected)
        this._setCloseKeyState(true);
      tabutils.dispatchEvent(aTab, "TabUnpinned", true, false);
    }
    else if (!aTab.hasAttribute("pinned") && aForce == null || aForce == true) {
      tabutils.setAttribute(aTab, "pinned", true);

      if (!aRestoring)
        this.faviconizeTab(aTab, true, true);

      if (!aRestoring && !aBookmarkId && !gPrivateBrowsingUI.privateBrowsingEnabled && TU_getPref("extensions.tabutils.autoPin", true)) {
        PlacesUtils.tagging.tagURI(aTab.linkedBrowser.currentURI, ["pinned"]);
        this.updatePinnedTabsBar();

        aTab.bookmarkId = PlacesUtils.getItemIdForTaggedURI(aTab.linkedBrowser.currentURI, "pinned");
      }
      else {
        aTab.bookmarkId = aBookmarkId;
      }
      tabutils.setTabValue(aTab, "bookmarkId", aTab.bookmarkId);
      tabutils.dispatchEvent(aTab, "TabPinning", true, false);

      this.mTabContainer.positionPinnedTab(aTab);
      this.mTabContainer.positionPinnedTabs();
      this.mTabContainer.stylePinnedTabs();
      this.mTabContainer.adjustTabstrip();

      aTab.linkedBrowser.docShell.isAppTab = true;
      if (aTab.selected)
        this._setCloseKeyState(false);
      tabutils.dispatchEvent(aTab, "TabPinned", true, false);
    }
  };

  gBrowser.unpinTab = function unpinTab(aTab, aForce, aBookmarkId, aRestoring) {
    if (!arguments.callee.caller || ["ssi_restoreWindow", "ssi_restoreHistoryPrecursor"].indexOf(arguments.callee.caller.name) > -1)
      aRestoring = true;

    this.pinTab(aTab, false, null, aRestoring);
  };

  TU_hookCode("gBrowser.onTabRestoring", "}", function() {
    this.pinTab(aTab, tabutils.getTabValue(aTab, "pinned") == "true", ss.getTabValue(aTab, "bookmarkId"), true);

    if (aTab.hasAttribute("pinned") && TU_getPref("extensions.tabutils.pinTab.autoRevert", false)) {
      let uri;
      try {
        uri = PlacesUtils.bookmarks.getBookmarkURI(aTab.bookmarkId);
      }
      catch (e) {}

      if (uri) {
        let browser = aTab.linkedBrowser;
        let history = browser.sessionHistory;
        if (history.count > 0)
          history.PurgeHistory(history.count);

        let tabData = browser.__SS_data;
        tabData.entries = [];
        tabData.index = 0;
        tabData.userTypedValue = uri.spec;
        tabData.userTypedClear = 1;
      }
    }
  });

  gBrowser.autoPinTab = function autoPinTab(aTab, aURI, aTags) {
    if (!aTab.hasAttribute("pinned") &&
        aTags.indexOf("pinned") > -1 &&
        TU_getPref("extensions.tabutils.autoPin", true) &&
        !Array.some(this.mTabs, function(bTab) bTab.hasAttribute("pinned") && bTab.linkedBrowser.currentURI.spec == aURI.spec)) {
      this.pinTab(aTab, true, PlacesUtils.getItemIdForTaggedURI(aURI, "pinned"), false); //Yes, it's false

      if (aTab.mCorrespondingButton &&
          !TU_getPref("extensions.tabutils.pinTab.autoRevert", false) &&
          PlacesUtils.annotations.itemHasAnnotation(aTab.bookmarkId, "tabState"))
      setTimeout(function() {
        aTab.linkedBrowser.stop();
        tabutils._ss.setTabState(aTab, PlacesUtils.annotations.getItemAnnotation(aTab.bookmarkId, "tabState"));
      }, 0);
    }
  };

  TU_hookCode("gBrowser.onTabOpen", "}", "this.autoPinTab(aTab, uri, tags);");
  TU_hookCode("gBrowser.onLocationChange", "}", "this.autoPinTab(aTab, uri, tags);");

  TU_hookCode("gBrowser.onTabClose", "}", function() {
    if (aTab.mCorrespondingButton && !gPrivateBrowsingUI.privateBrowsingEnabled) {
      PlacesUtils.setAnnotationsForItem(aTab.bookmarkId, [{name: "tabState", value: tabutils._ss.getTabState(aTab)}]);
      aTab.mCorrespondingButton.tab = null;
      aTab.mCorrespondingButton = null;
    }
  });

  TU_hookCode("gBrowser.moveTabTo", /.*_numPinnedTabs.*/g, ";");
  TU_hookCode("gBrowser.moveTabTo", "{", function() {
    aIndex = Math.min(Math.max(0, aIndex), this.mTabs.length - 1);
    if (aIndex == aTab._tPos)
      return;

    if (!arguments[2]) {
      if (aTab.mCorrespondingButton) {
        let bTab = this.mTabs[aIndex > aTab._tPos ? aIndex + 1 : aIndex];
        let bNode = bTab && bTab.mCorrespondingButton && (bTab.mCorrespondingButton.node || bTab.mCorrespondingButton._placesNode);
        let aNode = aTab.mCorrespondingButton.node || aTab.mCorrespondingButton._placesNode;
        PlacesUtils.bookmarks.moveItem(aNode.itemId, aNode.parent.itemId, bNode ? bNode.bookmarkIndex : -1);
        return;
      }

      for (var i = 0, tab; (tab = this.mTabs[i]) && tab.mCorrespondingButton; i++);
      for (var j = i, tab; (tab = this.mTabs[j]) && tab.hasAttribute("pinned"); j++);

      if (aTab.hasAttribute("pinned"))
        aIndex = Math.min(Math.max(i, aIndex), j - 1);
      else
        aIndex = Math.max(j, aIndex);

      if (aIndex == aTab._tPos)
        return;
    }
  });

  gBrowser.mTabContainer.positionPinnedTab = function positionPinnedTab(aTab) {
    if (aTab.mCorrespondingButton) {
      aTab.mCorrespondingButton.tab = null;
      aTab.mCorrespondingButton = null;
    }

    for (var i = 0, tab; (tab = this.childNodes[i]) && (tab.hasAttribute("pinned") || tab == aTab); i++);
    if (aTab.hasAttribute("pinned") ^ aTab._tPos < i)
      gBrowser.moveTabTo(aTab, aTab._tPos < i ? i - 1 : i, true);

    if (aTab.hasAttribute("pinned") && TU_getPref("extensions.tabutils.pinTab.showPhantom", true)) {
      gBrowser.moveTabTo(aTab, aTab._tPos < i ? i - 1 : i, true);

      let pinnedbox = this.mTabstrip._pinnedbox, n = 0;
      for (let button of pinnedbox.childNodes) {
        if (button.tab) {
          n++;
          continue;
        }
        if ((button.node || button._placesNode).itemId == aTab.bookmarkId) {
          button.tab = aTab;
          aTab.mCorrespondingButton = button;
          gBrowser.moveTabTo(aTab, n, true);
          break;
        }
      }
    }
  };

  gBrowser.mTabContainer.positionPinnedTabs = function positionPinnedTabs(aRebuild) {
    var pinnedbox = this.mTabstrip._pinnedbox;
    if (aRebuild) {
      for (let i = 0, tab; (tab = this.childNodes[i]) && tab.mCorrespondingButton; i++) {
        tab.mCorrespondingButton = null;
      }

      let n = 0;
      for (let button of pinnedbox.childNodes) {
        button.tab = null;
        for (let i = 0, tab; (tab = this.childNodes[i]) && tab.hasAttribute("pinned"); i++) {
          if (tab.bookmarkId == (button.node || button._placesNode).itemId) {
            button.tab = tab;
            tab.mCorrespondingButton = button;
            gBrowser.moveTabTo(tab, n++, true);
            break;
          }
        }
      }
    }

    if (this.firstChild.hasAttribute("pinned") || pinnedbox.hasChildNodes())
      this.setAttribute("haspinned", true);
    else
      this.removeAttribute("haspinned");

    for (let button of pinnedbox.childNodes) {
      button.width = button.tab ? button.tab.getBoundingClientRect().width : 0;
      button.style.opacity = button.width > 0 ? 0 : "";
    }

    var ltr = getComputedStyle(this, null).direction == "ltr";
    var [start, end] = ltr ? ["left", "right"] : ["right", "left"];
    pinnedbox.style.setProperty("border-" + start, "", ""); //RTL compatibility

    var pinnedboxEnd = pinnedbox.hasChildNodes() ? pinnedbox.lastChild.getBoundingClientRect()[end]
                                                 : pinnedbox.getBoundingClientRect()[start] + parseFloat(getComputedStyle(pinnedbox, null).getPropertyValue("padding-" + start)) * (ltr ? 1 : -1);
    var paddingEnd = 0;
    for (let i = 0, tab; (tab = this.childNodes[i]) && tab.hasAttribute("pinned"); i++) {
      if (tab.mCorrespondingButton) {
        let rect = tab.mCorrespondingButton.getBoundingClientRect();
        let style = getComputedStyle(tab.mCorrespondingButton, null);
        tab.style.left = rect.left - parseFloat(style.marginLeft) + "px";
      }
      else {
        let style = getComputedStyle(tab, null);
        let width = tab.boxObject.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
        tab.style.left = pinnedboxEnd + paddingEnd * (ltr ? 1 : -1) + width * (ltr ? 0 : -1) + "px";
        paddingEnd += width;
      }
    }
    pinnedbox.style.setProperty("border-" + end, paddingEnd > 0 ? paddingEnd + "px solid transparent" : "", "");

    this.mTabstrip.ensureElementIsVisible(this.selectedItem, false);
  };
  gBrowser.mTabContainer._positionPinnedTabs = gBrowser.mTabContainer.positionPinnedTabs;

  TU_hookCode("gBrowser.mTabContainer.adjustTabstrip", "{", "if (arguments[0]) this.positionPinnedTabs();");

  tabutils.addEventListener(gBrowser.mTabContainer, "overflow", function() {this.positionPinnedTabs();}, false);
  tabutils.addEventListener(gBrowser.mTabContainer, "underflow", function() {this.positionPinnedTabs();}, false);

  gBrowser.updatePinnedTabsBar = function updatePinnedTabsBar() {
    let tagId = -1;
    if (TU_getPref("extensions.tabutils.pinTab.showPhantom", true))
      tagId = PlacesUtils.getItemIdForTag("pinned");

    let pinnedbox = this.mTabContainer.mTabstrip._pinnedbox;
    let place = "place:folder=" + tagId;
    if (pinnedbox.place != place) {
      while (pinnedbox.hasChildNodes()) {
        let button = pinnedbox.firstChild;
        if (button.tab)
          button.tab.mCorrespondingButton = null;
        pinnedbox.removeChild(button);
      }
      pinnedbox.place = place;
    }
  };

  gBrowser.mTabContainer.__defineGetter__("_pinnedTabRules", function() {
    delete this._pinnedTabRules;
    return this._pinnedTabRules = [
      tabutils.insertRule('.tabbrowser-tabs[multirow] #PinnedTabsBar[style*="border"]:empty,' +
                          '.tabbrowser-tabs[multirow] #PinnedTabsBarItems[style*="border"]:empty,' +
                          '.tabbrowser-tabs[orient="vertical"] #PinnedTabsBarItems[style*="border"]:empty,' +
                          '.tabbrowser-tabs[orient="vertical"] #PinnedTabsBar[style*="border"]:empty {}'),
      tabutils.insertRule('.tabbrowser-tabs[multirow] > .tabbrowser-tab[pinned],' +
                          '#main-window .tabbrowser-tabs[orient="vertical"] > .tabbrowser-tab[pinned] {}'),
      tabutils.insertRule('#main-window .tabbrowser-tab[pinned]:not([selected="true"]) {}'),
      tabutils.insertRule('#main-window .tabbrowser-tab[pinned][selected="true"] {}'),
      tabutils.insertRule('#main-window .tabbrowser-tab[pinned] > * {}')
    ];
  });

  gBrowser.mTabContainer.stylePinnedTabs = function stylePinnedTabs() {
    var tab = this.lastChild;
    while (tab && tab.boxObject.height == 0)
      tab = tab.previousSibling;
    if (!tab)
      return;

    var wasSelected = tab.selected;
    var wasPinned = tab.hasAttribute("pinned");

    tab.removeAttribute("selected");
    tab.removeAttribute("pinned");
    var style = getComputedStyle(tab, null);
    var height = tab.boxObject.height;
    var lineHeight = tab.boxObject.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    this._pinnedTabRules[0].style.setProperty("height", height + "px", "");
    this._pinnedTabRules[1].style.setProperty("margin-top", -height + "px", "important");
    this._pinnedTabRules[2].style.setProperty("height", height + "px", "important");
    this._pinnedTabRules[2].style.setProperty("line-height", lineHeight + "px", "");

    tab.setAttribute("selected", true);
    var style = getComputedStyle(tab, null);
    var height = tab.boxObject.height;
    var lineHeight = tab.boxObject.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    this._pinnedTabRules[3].style.setProperty("height", height + "px", "important");
    this._pinnedTabRules[3].style.setProperty("line-height", lineHeight + "px", "");

    wasSelected ? tab.setAttribute("selected", true) : tab.removeAttribute("selected");
    wasPinned ? tab.setAttribute("pinned", true) : tab.removeAttribute("pinned");

    var tab = this.firstChild;
    while (tab && tab.boxObject.height == 0)
      tab = tab.nextSibling;

    if (tab && tab.hasAttribute("pinned")) {
      var rect = tab.getBoundingClientRect();
      var style = getComputedStyle(tab, null);
      var middle = (rect.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop) + rect.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom)) / 2;

      var icon = tab.boxObject.firstChild;
      var rect = icon.getBoundingClientRect();
      var style = getComputedStyle(icon, null);
      var x_middle = (rect.top - parseFloat(style.marginTop) + rect.bottom + parseFloat(style.marginBottom)) / 2 - (parseFloat(style.top) || 0);
      this._pinnedTabRules[4].style.setProperty("top", middle - x_middle + "px", "");
    }
  };

  tabutils.addEventListener(window, "resize", function(event) {
    if (!arguments.callee._initialized) {
      if (event.target != window)
        return;
      arguments.callee._initialized = true;
    }

    var tabContainer = gBrowser.mTabContainer;
    var boxObject = tabContainer.mTabstrip.boxObject;
    if (tabContainer.mTabstripX != boxObject.x || tabContainer.mTabstripY != boxObject.y) {
      tabContainer.positionPinnedTabs();
      tabContainer.mTabstripX = boxObject.x;
      tabContainer.mTabstripY = boxObject.y;
    }

    if (tabContainer.mTabstripHeight != boxObject.height) {
      tabContainer.stylePinnedTabs();
      tabContainer.mTabstripHeight = boxObject.height;
    }
  }, false);

  gBrowser.selectUnpinnedTabAtIndex = function selectUnpinnedTabAtIndex(aIndex, aEvent) {
    var tabs = Array.filter(this.mTabs, function(aTab) !aTab.hasAttribute("pinned") && aTab.boxObject.width > 0);
    if (aIndex < 0)
      aIndex += tabs.length;

    if (aIndex >= 0 && aIndex < tabs.length)
      this.selectedTab = tabs[aIndex];

    if (aEvent) {
      aEvent.preventDefault();
      aEvent.stopPropagation();
    }
  };

  gBrowser.selectPinnedTabAtIndex = function selectPinnedTabAtIndex(aIndex, aEvent) {
    var tabs = this.mTabContainer.mTabstrip._pinnedbox.childNodes;
    if (tabs.length == 0)
      tabs = Array.filter(this.mTabs, function(aTab) aTab.hasAttribute("pinned"));

    if (aIndex < 0)
      aIndex += tabs.length;

    if (aIndex >= 0 && aIndex < tabs.length)
      (tabs[aIndex].tab || tabs[aIndex]).click();

    if (aEvent) {
      aEvent.preventDefault();
      aEvent.stopPropagation();
    }
  };
};

//���ر�ǩҳ
tabutils._hideTab = function() {
  gBrowser.concealTab = function concealTab(aTab, aForce, aRestoring) {
    if (aTab.hasAttribute("concealed") && aForce != true) {
      tabutils.removeAttribute(aTab, "concealed");
      aTab.removeAttribute("disabled");
      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled) {
        PlacesUtils.tagging.untagURI(aTab.linkedBrowser.currentURI, ["concealed"]);
      }
      this.mTabContainer.adjustTabstrip(aTab.hasAttribute("pinned"));
    }
    else if (!aTab.hasAttribute("concealed") && aForce != false) {
      tabutils.setAttribute(aTab, "concealed", true);
      aTab.setAttribute("disabled", true);
      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled && TU_getPref("extensions.tabutils.autoHide", true)) {
        PlacesUtils.tagging.tagURI(aTab.linkedBrowser.currentURI, ["concealed"]);
      }
      this.mTabContainer.adjustTabstrip(aTab.hasAttribute("pinned"));
    }
  };

  TU_hookCode("gBrowser.onTabRestoring", "}", function() {
    this.concealTab(aTab, ss.getTabValue(aTab, "concealed") == "true", true);
  });

  gBrowser.autoConcealTab = function autoConcealTab(aTab, aURI, aTags) {
    if (!aTab.hasAttribute("concealed") && aTags.indexOf("concealed") > -1 && TU_getPref("extensions.tabutils.autoHide", true))
      this.concealTab(aTab, true, true);
  };

  TU_hookCode("gBrowser.onTabOpen", "}", "this.autoConcealTab(aTab, uri, tags);");
  TU_hookCode("gBrowser.onLocationChange", "}", "this.autoConcealTab(aTab, uri, tags);");
};

//��������ǩҳ
tabutils._renameTab = function() {
  gBrowser.renameTab = function renameTab(aTab, aTitle, aRestoring) {
    if (aTab.getAttribute("title") == aTitle)
      return;

    if (aTitle)
      tabutils.setAttribute(aTab, "title", aTitle);
    else
      tabutils.removeAttribute(aTab, "title");

    if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled && TU_getPref("extensions.tabutils.autoRename", true)) {
      PlacesUtils.tagging[aTitle ? "tagURI" : "untagURI"](aTab.linkedBrowser.currentURI, ["autoRename"]);

      let itemId = PlacesUtils.getItemIdForTaggedURI(aTab.linkedBrowser.currentURI, "autoRename");
      if (itemId != -1)
        PlacesUtils.bookmarks.setItemTitle(itemId, aTitle);
    }

    this.setTabTitle(aTab);
  }

  TU_hookCode("gBrowser.onTabRestoring", "}", function() {
    tabutils.restoreAttribute(aTab, "title");
    if (aTab.hasAttribute("title")) {
      aTab.label = aTab.getAttribute("title");
      aTab.crop = "end";
    }
  });

  gBrowser.autoRenameTab = function autoRenameTab(aTab, aURI, aTags) {
    if (!aTab.hasAttribute("title") && aTags.indexOf("autoRename") > -1 && TU_getPref("extensions.tabutils.autoRename", true)) {
      let itemId = PlacesUtils.getItemIdForTaggedURI(aURI, "autoRename");
      this.renameTab(aTab, PlacesUtils.bookmarks.getItemTitle(itemId), true);
    }
  };

  TU_hookCode("gBrowser.onTabOpen", "}", "this.autoRenameTab(aTab, uri, tags);");
  TU_hookCode("gBrowser.onLocationChange", "}", "this.autoRenameTab(aTab, uri, tags);");

  TU_hookCode("gBrowser.setTabTitle", "browser.contentTitle", "aTab.getAttribute('title') || $&");
  TU_hookCode("gBrowser.getWindowTitleForBrowser", "aBrowser.contentTitle", "this.mTabs[this.browsers.indexOf(aBrowser)].getAttribute('title') || $&");

  //Bookmark title as Tab title
  TU_hookCode("gBrowser.loadOneTab",
    ["{", "var lastArg = Object(arguments[arguments.length - 1]);"],
    [/(?=return tab;)/, function() {
      if (lastArg.title && TU_getPref("extensions.tabutils.titleAsBookmark", false))
        tab.setAttribute("title", lastArg.title);
    }]
  );

  TU_hookCode("gBrowser.loadTabs",
    ["{", "var lastArg = Object(arguments[arguments.length - 1]), aTitles = TU_getPref('extensions.tabutils.titleAsBookmark', false) ? lastArg.titles : null;"],
    [/(\w+) = .*addTab.*\[(.*)\].*/g, "$&" + <![CDATA[
      if (aTitles && aTitles[$2])
        $1.setAttribute("title", aTitles[$2]);
    ]]>]
  );
};

//������ǩҳ
tabutils._restartTab = function() {
  gBrowser.restartTab = function restartTab(aTab) {
    var tabState = tabutils._ss.getTabState(aTab);
    var bTab = this.addTab();
    bTab.collapsed = true;
    bTab.linkedBrowser.stop();
    bTab.linkedBrowser.docShell;
    this.swapBrowsersAndCloseOther(aTab, bTab);
    tabutils._ss.setTabState(aTab, tabState);
  };

  TU_hookCode("gBrowser.onTabRestoring", "}", "aTab.setAttribute('restoring', true);");
  //TU_hookCode("gBrowser.onTabRestored", "}", "aTab.removeAttribute('restoring');");
  TU_hookCode("gBrowser.mTabProgressListener", /(?=var location)/, function() {
    if (this.mTab.hasAttribute("restoring")) {
      let tabData = this.mBrowser.__SS_data;
      if (!tabData || !tabData._tabStillLoading)
        this.mTab.removeAttribute("restoring");
    }
  });

  if (gBrowser.mTabContainer.mAllTabsPopup)
  TU_hookCode("gBrowser.mTabContainer.mAllTabsPopup._setMenuitemAttributes",
    ["}", function() {
      if (aTab.hasAttribute("restoring"))
        aMenuitem.setAttribute("restoring", aTab.getAttribute("restoring"));
      else
        aMenuitem.removeAttribute("restoring");
    }]
  );

  gBrowser.autoRestartTab = function autoRestartTab(aTab) {
    if (aTab.selected || aTab._restartTimer || ["busy", "restoring", "pending"].some(function(aAttr) aTab.hasAttribute(aAttr)))
      return;

    let restartAfter = TU_getPref("extensions.tabutils.restartAfter", 0);
    if (restartAfter == 0)
      return;

    let spec = aTab.linkedBrowser.currentURI.spec;
    if (tabutils.getURIsForTag("norestart").some(function(aURI) spec.startsWith(aURI.spec)))
      return;

    aTab._restartTimer = setTimeout(function(aTab) {
      if (aTab && aTab.parentNode)
        gBrowser.restartTab(aTab);
    }, restartAfter * 60 * 1000, aTab);
  };

  TU_hookCode("gBrowser.onTabSelect", "}", function() {
    if (aTab._restartTimer) {
      clearTimeout(aTab._restartTimer);
      aTab._restartTimer = null;
    }

    var lastTab = this.getLastSelectedTab(1, true, true);
    if (lastTab)
      this.autoRestartTab(lastTab);
  });

  TU_hookCode("gBrowser.mTabProgressListener", /(?=var location)/, function() {
    if (this.mTab._restartTimer) {
      clearTimeout(this.mTab._restartTimer);
      this.mTab._restartTimer = null;
    }
    this.mTabBrowser.autoRestartTab(this.mTab);
  });
};

//�Զ�ˢ�±�ǩҳ
tabutils._reloadEvery = function() {
  gBrowser.autoReloadTab = function autoReloadTab(aTab, aForce, aInterval, aRestoring) {
    if (aTab.hasAttribute("autoReload") && aForce != true) {
      tabutils.removeAttribute(aTab, "autoReload");
      tabutils.deleteTabValue(aTab, "reloadInterval");
      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled) {
        PlacesUtils.tagging.untagURI(aTab.linkedBrowser.currentURI, ["autoReload"]);
      }
      this.mTabContainer.adjustTabstrip(aTab.hasAttribute("pinned"));

      clearTimeout(aTab._reloadTimer);
    }
    else if (!aTab.hasAttribute("autoReload") && aForce == null || aForce == true) {
      tabutils.setAttribute(aTab, "autoReload", true);
      aTab._reloadInterval = aInterval || aTab._reloadInterval || TU_getPref("extensions.tabutils.reloadInterval", 10);
      TU_setPref("extensions.tabutils.reloadInterval", aTab._reloadInterval);
      tabutils.setTabValue(aTab, "reloadInterval", aTab._reloadInterval);

      if (!aRestoring && !gPrivateBrowsingUI.privateBrowsingEnabled && TU_getPref("extensions.tabutils.autoEnableAutoReload", true)) {
        PlacesUtils.tagging.tagURI(aTab.linkedBrowser.currentURI, ["autoReload"]);

        let itemId = PlacesUtils.getItemIdForTaggedURI(aTab.linkedBrowser.currentURI, "autoReload");
        if (itemId != -1)
          PlacesUtils.setAnnotationsForItem(itemId, [{name: "reloadInterval", value: aTab._reloadInterval}]);
      }
      this.mTabContainer.adjustTabstrip(aTab.hasAttribute("pinned"));

      clearTimeout(aTab._reloadTimer);
      aTab._reloadTimer = setTimeout(function(aTab) {
        if (aTab && aTab.parentNode)
          gBrowser.reloadTab(aTab);
      }, aTab._reloadInterval * 1000, aTab);
    }
  };

  TU_hookCode("gBrowser.onTabRestoring", "}", function() {
    this.autoReloadTab(aTab, ss.getTabValue(aTab, "autoReload") == "true", ss.getTabValue(aTab, "reloadInterval"), true);
  });

  gBrowser.autoAutoReloadTab = function autoAutoReloadTab(aTab, aURI, aTags) {
    if (!aTab.hasAttribute("autoReload") && aTags.indexOf("autoReload") > -1 && TU_getPref("extensions.tabutils.autoEnableAutoReload", true)) {
      let itemId = PlacesUtils.getItemIdForTaggedURI(aURI, "autoReload"), reloadInterval;
      if (PlacesUtils.annotations.itemHasAnnotation(itemId, "reloadInterval")) {
        reloadInterval = PlacesUtils.annotations.getItemAnnotation(itemId, "reloadInterval");
      }
      this.autoReloadTab(aTab, true, reloadInterval, true);
    }
  };

  TU_hookCode("gBrowser.onTabOpen", "}", "this.autoAutoReloadTab(aTab, uri, tags);");
  TU_hookCode("gBrowser.onLocationChange", "}", "this.autoAutoReloadTab(aTab, uri, tags);");

  TU_hookCode("gBrowser.mTabProgressListener", /(?=var location)/, function() {
    if (this.mTab.hasAttribute("autoReload")) {
      clearTimeout(this.mTab._reloadTimer);
      this.mTab._reloadTimer = setTimeout(function(aTab) {
        if (aTab && aTab.parentNode)
          gBrowser.reloadTab(aTab);
      }, this.mTab._reloadInterval * 1000, this.mTab);
    }
  });

  gBrowser.updateAutoReloadPopup = function updateAutoReloadPopup(aPopup) {
    aPopup.value = gBrowser.mContextTab._reloadInterval || TU_getPref("extensions.tabutils.reloadInterval", 10);
    aPopup.label = (function() {
      var m = parseInt(aPopup.value / 60), s = aPopup.value % 60;
      return (m > 1 ? m + " " + aPopup.getAttribute("minutes") : m > 0 ? m + " " + aPopup.getAttribute("minute") : "")
           + (m > 0 && s > 0 ? " " : "")
           + (s > 1 ? s + " " + aPopup.getAttribute("seconds") : s > 0 ? s + " " + aPopup.getAttribute("second") : "");
    })();

    var itemEnable = aPopup.getElementsByAttribute("anonid", "enable")[0];
    itemEnable.setAttribute("checked", gBrowser.mContextTabs.every(function(aTab) aTab.hasAttribute("autoReload")));
    itemEnable.setAttribute("label", itemEnable.getAttribute("text") + ": " + aPopup.label);

    var itemCustom = aPopup.getElementsByAttribute("anonid", "custom")[0];
    var item = aPopup.getElementsByAttribute("value", aPopup.value)[0];
    if (item) {
      item.setAttribute("checked", true);
    }
    else {
      itemCustom.setAttribute("checked", true);
      itemCustom.setAttribute("value", aPopup.value);
    }

    if (itemCustom.hasAttribute("checked")) {
      itemCustom.setAttribute("label", itemCustom.getAttribute("text") + ": " + aPopup.label);
    }
    else {
      itemCustom.setAttribute("label", itemCustom.getAttribute("text") + PlacesUIUtils.ellipsis);
    }
  };
};

//������ǩ��
tabutils._bookmarkTabs = function() {
  gBrowser.bookmarkTab = function(aTabs) {
    if (!("length" in aTabs))
      aTabs = [aTabs];

    if (aTabs.length > 1) {
      let tabURIs = TU_getPref("extensions.tabutils.bookmarkWithHistory", false) ?
                    Array.map(aTabs, function(aTab) [aTab.linkedBrowser.currentURI, [{name: 'bookmarkProperties/tabState', value: tabutils._ss.getTabState(aTab)}]]) :
                    Array.map(aTabs, function(aTab) aTab.linkedBrowser.currentURI);
      PlacesUIUtils.showBookmarkDialog({action: "add",
                                        type: "folder",
                                        URIList: tabURIs,
                                        hiddenRows: ["description"]}, window);
    }
    else
      PlacesCommandHook.bookmarkPage(aTabs[0].linkedBrowser, PlacesUtils.bookmarksMenuFolderId, true);
  };

  TU_hookCode("PlacesCommandHook.bookmarkPage",
    [/(?=.*(createItem|PlacesCreateBookmarkTransaction).*)/, function() {
      var annos = [descAnno];
      if (TU_getPref("extensions.tabutils.bookmarkWithHistory", false)) {
        let tab = gBrowser.mTabs[gBrowser.browsers.indexOf(aBrowser)];
        if (tab)
          annos.push({name: "bookmarkProperties/tabState", value: tabutils._ss.getTabState(tab)});
      }
    }],
    [/.*(createItem|PlacesCreateBookmarkTransaction).*/, function(s) s.replace("[descAnno]", "annos")]  // Bug 575955 [Fx13]
  );

  TU_hookCode("PlacesCommandHook.bookmarkCurrentPages",
    ["this.uniqueCurrentPages", <![CDATA[
      TU_getPref("extensions.tabutils.bookmarkAllWithHistory", true) ?
      Array.map(gBrowser.allTabs, function(aTab) [aTab.linkedBrowser.currentURI, [{name: 'bookmarkProperties/tabState', value: tabutils._ss.getTabState(aTab)}]]) :
      Array.map(gBrowser.allTabs, function(aTab) aTab.linkedBrowser.currentURI);
    ]]>],
    ["pages.length > 1", "true"]
  );

  //Highlight bookmarks with history
  TU_hookCode("PlacesViewBase.prototype._createMenuItemForPlacesNode", /(?=return element;)/, function() {
    if (aPlacesNode.itemId != -1 && PlacesUtils.annotations.itemHasAnnotation(aPlacesNode.itemId, "bookmarkProperties/tabState"))
      element.setAttribute("history", true);
  });

  TU_hookCode("PlacesToolbar.prototype._insertNewItem", "}", function() {
    if (aChild.itemId != -1 && PlacesUtils.annotations.itemHasAnnotation(aChild.itemId, "bookmarkProperties/tabState"))
      button.setAttribute("history", true);
  });

  //Open bookmarks with history
  TU_hookCode("gBrowser.loadOneTab",
    ["{", "var lastArg = Object(arguments[arguments.length - 1]);"],
    [/(?=return tab;)/, function() {
      if (lastArg.itemId && PlacesUtils.annotations.itemHasAnnotation(lastArg.itemId, "bookmarkProperties/tabState")) {
        tab.linkedBrowser.stop();
        tabutils._ss.setTabState(tab, PlacesUtils.annotations.getItemAnnotation(lastArg.itemId, "bookmarkProperties/tabState"));
      }
    }]
  );

  TU_hookCode("gBrowser.loadTabs",
    ["{", "var lastArg = Object(arguments[arguments.length - 1]), aItemIds = lastArg.itemIds;"],
    [/(\w+) = .*addTab.*\[(.*)\].*/g, "$&" + <![CDATA[
      if (aItemIds && aItemIds[$2] && PlacesUtils.annotations.itemHasAnnotation(aItemIds[$2], "bookmarkProperties/tabState")) {
        $1.linkedBrowser.stop();
        tabutils._ss.setTabState($1, PlacesUtils.annotations.getItemAnnotation(aItemIds[$2], "bookmarkProperties/tabState"));
      }
    ]]>]
  );
};

tabutils._multiTabHandler = function() {

  //ѡ������ǩҳ
  gBrowser.isNormalTab = function isNormalTab(aTab) {
    return !aTab.hasAttribute("pinned") && !aTab.hasAttribute("hidden") && !aTab.hasAttribute("concealed") && !aTab.hasAttribute("removing");
  };

  gBrowser.__defineGetter__("allTabs", function() {
    let tabs = Array.filter(this.mTabs, this.isNormalTab);
    return tabs.length > 0 ? tabs : (this.visibleTabs || this.mTabs);
  });

  gBrowser.__defineGetter__("selectedTabs", function() {
    return Array.filter(this.mTabs, function(aTab) aTab.hasAttribute("multiselected"));
  });

  gBrowser.__defineSetter__("selectedTabs", function(val) {
    Array.forEach(this.mTabs, function(aTab) aTab.removeAttribute("multiselected"));
    Array.forEach(val, function(aTab) {
      if (aTab.boxObject.width > 0) {
        if (aTab.getAttribute("group-collapsed") == "true" && aTab.getAttribute("group-counter") > 1) {
          let tabs = this.siblingTabsOf(aTab);
          tabs.forEach(function(aTab) aTab.setAttribute("multiselected", true));
        }
        aTab.setAttribute("multiselected", true);
      }
    }, this);
    this._lastClickedTab = null;
    return val;
  });

  gBrowser.contextTabsOf = function contextTabsOf(aTab) {
    return aTab.hasAttribute("multiselected") ? this.selectedTabs :
           aTab.getAttribute("group-collapsed") == "true" || aTab.mOverTwisty ? this.siblingTabsOf(aTab) : [aTab];
  };

  gBrowser.selectTab = function selectTab(aTab, aForce) {
    if (aForce == null)
      aForce = !aTab.hasAttribute("multiselected");

    if (aTab.getAttribute("group-collapsed") == "true" && aTab.getAttribute("group-counter") > 1) {
      let tabs = this.siblingTabsOf(aTab);
      if (aForce)
        tabs.forEach(function(aTab) aTab.setAttribute("multiselected", true));
      else
        tabs.forEach(function(aTab) aTab.removeAttribute("multiselected"));
    }
    aForce ? aTab.setAttribute("multiselected", true) : aTab.removeAttribute("multiselected");
    this._lastClickedTab = aTab;
  };

  gBrowser.selectTabs = function selectTabs(aTab, aKeepSelection) {
    var bTab = this._lastClickedTab || this.mCurrentTab;
    var [start, end] = aTab._tPos < bTab._tPos ? [aTab._tPos, bTab._tPos] : [bTab._tPos, aTab._tPos];
    this.selectedTabs = Array.slice(this.mTabs, start, end + 1)
                             .concat(aKeepSelection ? this.selectedTabs : []);
    this._lastClickedTab = bTab;
  };

  gBrowser.selectAllTabs = function() {
    var allTabs = this.allTabs;
    this.selectedTabs = this.selectedTabs.map(function(aTab) aTab._tPos).join() ==
                        allTabs.map(function(aTab) aTab._tPos).join() ? (this.visibleTabs || this.mTabs) : allTabs;
  };

  TU_hookCode("gBrowser.onTabSelect", "}", function() {
    if (!aTab.hasAttribute("multiselected"))
      this.selectedTabs = [];
  });

  TU_hookCode("gBrowser.onTabHide", "}", function() {
    aTab.removeAttribute("multiselected");
  });

  TU_hookCode("gBrowser.onStackCollapsed", "}", function() {
    let tabs = this.siblingTabsOf(aTab);
    if (!tabs.every(function(aTab) aTab.hasAttribute("multiselected")))
      tabs.forEach(function(aTab) aTab.removeAttribute("multiselected"));
  });

//  var tabContextMenu = gBrowser.tabContextMenu;
//  tabContextMenu.setAttribute("oncommand", "gBrowser.selectedTabs = [];");

  //���/�Ҳ�/����/�ظ�/���Ʊ�ǩҳ
  gBrowser.leftTabsOf = function leftTabsOf(aTabs) {
    if (!("length" in aTabs))
      aTabs = [aTabs];

    return Array.slice(this.mTabs, 0, aTabs[0]._tPos).filter(this.isNormalTab);
  };

  gBrowser.rightTabsOf = function rightTabsOf(aTabs) {
    if (!("length" in aTabs))
      aTabs = [aTabs];

    return Array.slice(this.mTabs, aTabs[aTabs.length - 1]._tPos + 1).filter(this.isNormalTab);
  };

  gBrowser.otherTabsOf = function otherTabsOf(aTabs) {
    if (!("length" in aTabs))
      aTabs = [aTabs];

    return Array.filter(this.mTabs, function(aTab) this.isNormalTab(aTab) && Array.indexOf(aTabs, aTab) == -1, this);
  };

  gBrowser.duplicateTabsOf = function duplicateTabsOf(aTabs) {
    if (!("length" in aTabs))
      aTabs = [aTabs];

    return Array.filter(this.mTabs, function(aTab) this.isNormalTab(aTab) && Array.some(aTabs, function(bTab) {
      return aTab.linkedBrowser.currentURI.spec == bTab.linkedBrowser.currentURI.spec;
    }), this);
  };

  gBrowser.similarTabsOf = function similarTabsOf(aTabs) {
    if (!("length" in aTabs))
      aTabs = [aTabs];

    return Array.filter(this.mTabs, function(aTab) this.isNormalTab(aTab) && Array.some(aTabs, function(bTab) {
      try {
        return aTab.linkedBrowser.currentURI.host == bTab.linkedBrowser.currentURI.host;
      }
      catch (e) {
        return aTab.linkedBrowser.currentURI.spec == bTab.linkedBrowser.currentURI.spec;
      }
    }), this);
  };

  gBrowser.uniqueTabsOf = function uniqueTabsOf(aTabs) {
    if (!("length" in aTabs))
      aTabs = [aTabs];

    var seenURIs = {};
    return Array.reduce(aTabs, function(aTabs, aTab) {
      var uri = aTab.linkedBrowser.currentURI.spec;
      if (!(uri in seenURIs)) {
        seenURIs[uri] = true;
        aTabs.push(aTab);
      }
      return aTabs;
    }, []);
  };

  //�رն����ǩҳ
  TU_hookCode("gBrowser.warnAboutClosingTabs", /\w+(?= <= 1)/, "($& = arguments[1] ? arguments[1].length : $&)");
  gBrowser.removeTabsBut = function removeTabsBut(aTabs, bTabs) {
    aTabs = aTabs ? "length" in aTabs ? aTabs : [aTabs] : [];
    bTabs = bTabs ? "length" in bTabs ? bTabs : [bTabs] : [];

    if (bTabs.length > 0)
      aTabs = Array.filter(aTabs, function(aTab) Array.indexOf(bTabs, aTab) == -1);

    if (aTabs.length == 0)
      return;

    if (aTabs.length == 1)
      return this.removeTab(aTabs[0], {animate: true});

    if (this.warnAboutClosingTabs(true, aTabs)) {
      if (Array.indexOf(aTabs, this.mCurrentTab) > -1)
        this.selectedTab = bTabs[0] || aTabs[0];

      let count = 0;
      for (let i = aTabs.length - 1; i >= 0; i--) {
        this.removeTab(aTabs[i]);
        if (aTabs[i].hasAttribute("removing"))
          count++;
      }
      this._lastClosedTabsCount = count;
    }
  };

  TU_hookCode("undoCloseTab", /.*ss.undoCloseTab.*/, "for (let i = aIndex == null ? gBrowser._lastClosedTabsCount || 1 : 1; i > 0; i--) $&;");

  gBrowser.closeLeftTabs = function(aTab) this.removeTabsBut(this.leftTabsOf(aTab), aTab);
  gBrowser.closeRightTabs = function(aTab) this.removeTabsBut(this.rightTabsOf(aTab), aTab);
  gBrowser.closeOtherTabs = function(aTab) this.removeTabsBut(this.otherTabsOf(aTab), aTab);
  gBrowser.closeDuplicateTabs = function(aTab) this.removeTabsBut(this.duplicateTabsOf(aTab), aTab);
  gBrowser.closeSimilarTabs = function(aTab) this.removeTabsBut(this.similarTabsOf(aTab), aTab);
  gBrowser.closeAllTabs = function() this.removeTabsBut(this.allTabs);
  gBrowser.closeAllDuplicateTabs = function() this.removeTabsBut(this.allTabs, this.uniqueTabsOf(this.allTabs));

  //��ҷ�����ǩҳ
  gBrowser.gatherTabs = function gatherTabs(aTabs, aTab, aSuppressTabMove) {
    let index = 0;
    if (aTab) {
      index = aTabs.indexOf(aTab);
      if (index == -1) {
        while (++index < aTabs.length && aTabs[index]._tPos < aTab._tPos);
        aTabs.splice(index, 0, aTab);
      }
    }

    for (let i = index - 1; i >= 0; i--) {
      aTabs[i]._suppressTabMove = aSuppressTabMove;
      this.moveTabBefore(aTabs[i], aTabs[i + 1]);
      delete aTabs[i]._suppressTabMove;
    }

    for (let i = index + 1; i < aTabs.length; i++) {
      aTabs[i]._suppressTabMove = aSuppressTabMove;
      this.moveTabAfter(aTabs[i], aTabs[i - 1]);
      delete aTabs[i]._suppressTabMove;
    }
  };

  gBrowser.moveTabBefore = function moveTabBefore(aTab, bTab) {
    this.moveTabTo(aTab, aTab._tPos < bTab._tPos ? bTab._tPos - 1 : bTab._tPos);
  };

  gBrowser.moveTabAfter = function moveTabAfter(aTab, bTab) {
    this.moveTabTo(aTab, aTab._tPos > bTab._tPos ? bTab._tPos + 1 : bTab._tPos);
  };

  TU_hookCode("gBrowser.onTabMove", "{", function() {
    if (aTab._suppressTabMove)
      return;
  });

  tabutils.addEventListener(gBrowser.mTabContainer, "dragstart", function(event) {
    if (event.target.localName == "tab") {
      let draggedTab = event.target;
      let draggedTabs = gBrowser.contextTabsOf(draggedTab);
      draggedTabs.splice(draggedTabs.indexOf(draggedTab), 1);
      draggedTabs.unshift(draggedTab);

      let dt = event.dataTransfer;
      draggedTabs.forEach(function(aTab, aIndex) {
        dt.mozSetDataAt(TAB_DROP_TYPE, aTab, aIndex);
        dt.mozSetDataAt("text/x-moz-text-internal", aTab.linkedBrowser.currentURI.spec, aIndex);
      });
    }
  }, true);

  TU_hookCode("gBrowser.mTabContainer._setEffectAllowedForDataTransfer",
    ["dt.mozItemCount > 1", "false"]
  );

  TU_hookCode("gBrowser.onTabMove", "}", function() {
    if (aTab.hasAttribute("multiselected")) {
      let selectedTabs = this.selectedTabs;
      if (selectedTabs[selectedTabs.length - 1]._tPos - selectedTabs[0]._tPos >= selectedTabs.length) {
        let tabs = selectedTabs.filter(function(aTab) aTab.boxObject.width > 0);
        tabs.splice(tabs.indexOf(aTab), 1);

        let index = 0;
        let oldPos = aTab._tPos > event.detail ? event.detail - 0.5 : event.detail + 0.5;
        while (index < tabs.length && tabs[index]._tPos < oldPos)
          index++;
        tabs.splice(index, 0, aTab);

        setTimeout(function(self) {
          self.selectedTabs = [];
          self.gatherTabs(tabs, aTab);
          self.selectedTabs = selectedTabs;
        }, 0, this);
      }
    }
  });

  TU_hookCode("gBrowser.moveTabTo",
    ["this.mCurrentTab._selected = false;", "let wasFocused = this.mCurrentTab == document.commandDispatcher.focusedElement;$&"],
    ["this.mCurrentTab._selected = true;", "$&;if (wasFocused) this.mCurrentTab.focus();"]
  );

  ["moveTabBackward", "moveTabForward", "moveTabToStart", "moveTabToEnd"].forEach(function(aMethod) {
    TU_hookCode.call(gBrowser, aMethod, "this.mCurrentTab.focus();", "");
  });

  TU_hookCode("gBrowser.moveTabBackward", "this.mCurrentTab._tPos", <![CDATA[ //Bug 656222
    (function (self) {
      let tab = self.mCurrentTab.previousSibling;
      while (tab && tab.boxObject.width == 0)
        tab = tab.previousSibling;
      return tab ? tab._tPos + 1 : 0;
    })(this)
  ]]>);

  TU_hookCode("gBrowser.moveTabForward", "this.mCurrentTab._tPos", <![CDATA[
    (function (self) {
      let tab = self.mCurrentTab.nextSibling;
      while (tab && tab.boxObject.width == 0)
        tab = tab.nextSibling;
      return tab ? tab._tPos - 1 : self.mTabs.length;
    })(this)
  ]]>);

  //Protect/Lock/Freeze/Faviconize/Pin/Hide All Tabs
  [
    ["gBrowser.unreadTab", ["unread"]],
    ["gBrowser.protectTab", ["protected"]],
    ["gBrowser.lockTab", ["locked"]],
    ["gBrowser.freezeTab", ["protected", "locked"]],
    ["gBrowser.faviconizeTab", ["faviconized"]],
    ["gBrowser.pinTab", ["pinned"]],
    ["gBrowser.concealTab", ["concealed"]],
    ["gBrowser.autoReloadTab", ["autoReload"]]
  ].forEach(function([aFuncName, aAttrs]) {
    TU_hookCode(aFuncName, "{", <![CDATA[
      if ("length" in arguments[0]) {
        let aTabs = Array.slice(arguments[0]);
        if (aForce == null)
          aForce = !aTabs.every(function(aTab) aAttrs.every(function(aAttr) aTab.hasAttribute(aAttr)));

        let func = arguments.callee, args = Array.slice(arguments, 2);
        aTabs.forEach(function(aTab) {
          func.apply(this, Array.concat(aTab, aForce, args));
        }, this);
        return;
      }
    ]]>.toString().replace("aAttrs", aAttrs.toSource()));
  });

  TU_hookCode("gBrowser.reloadTab", /.*reload\b.*/, "try {$&} catch (e) {}");

  gBrowser.moveTabToWindow = function moveTabToWindow(aTabs, aWindow) {
    if (!aWindow) {
      aTabs[0].selectedTabs = aTabs;
      return this.replaceTabWithWindow(aTabs[0]);
    }

    let bTabs = [];
    aTabs.forEach(function(aTab) {
      let bTab = this.addTab();
      bTab.linkedBrowser.stop();
      bTab.linkedBrowser.docShell;
      this.swapBrowsersAndCloseOther(bTab, aTab);
      bTabs.push(bTab);
    }, aWindow.gBrowser);

    if (bTabs.length > 1 && aWindow.TU_getPref("extensions.tabutils.autoStack", false))
      aWindow.gBrowser.groupTabs(bTabs);

    return aWindow;
  };

  TU_hookCode("gBrowser.swapBrowsersAndCloseOther", /(?=.*_beginRemoveTab.*)/, function() {
    if (arguments.callee.caller)  // Fx15
    if ([gBrowserInit.onLoad, gBrowserInit._delayedStartup].indexOf(arguments.callee.caller) > -1 ||  // Bug 756313 [Fx19]
        ["onxbldrop", "_handleTabDrop"].indexOf(arguments.callee.caller.name) > -1) {
      let selectedTabs = aOtherTab.selectedTabs || remoteBrowser.contextTabsOf(aOtherTab);
      if (selectedTabs.length > 1) {
        this.swapBrowsersAndCloseOther(aOurTab, selectedTabs.shift());

        let bTabs = [aOurTab];
        selectedTabs.forEach(function(aTab, aIndex) {
          let bTab = this.addTab();
          bTab.linkedBrowser.stop();
          bTab.linkedBrowser.docShell;
          this.moveTabTo(bTab, aOurTab._tPos + aIndex + 1);
          this.swapBrowsersAndCloseOther(bTab, aTab);
          bTabs.push(bTab);
        }, this);

        if (bTabs.length < this.mTabs.length && TU_getPref("extensions.tabutils.autoStack", false))
          this.groupTabs(bTabs);

        return;
      }
    }
  });

  [
    ["context_reloadTab", "gBrowser.mContextTabs.forEach(gBrowser.reloadTab, gBrowser);"],
    ["context_reloadAllTabs", "gBrowser.allTabs.forEach(gBrowser.reloadTab, gBrowser);"],
    ["context_openTabInWindow", "gBrowser.moveTabToWindow(gBrowser.mContextTabs);"],
    ["context_bookmarkTab", "gBrowser.bookmarkTab(gBrowser.mContextTabs);"],
    ["context_closeTab", "gBrowser.removeTabsBut(gBrowser.mContextTabs);"],
    ["context_closeOtherTabs", "gBrowser.removeTabsBut(gBrowser.allTabs, gBrowser.mContextTabs);"]
  ].forEach(function([aId, aCommand]) {
    var item = document.getElementById(aId);
    if (item) {
      item.setAttribute("oncommand", aCommand);
      item.setAttribute("multiselected", "any");
    }
  });
}

//��ǩҳ����
tabutils._groupTabs = function() {
  gBrowser.siblingTabsOf = function siblingTabsOf(aTab, aFull) {
    if (aFull)
      return Array.filter(this.mTabs, function(bTab) aTab.getAttribute("group") == bTab.getAttribute("group") && this.isNormalTab(bTab), this);

    let tabs = [aTab];
    for (let tab = aTab; (tab = tab.nextSibling) && tab.getAttribute("group") == aTab.getAttribute("group");) {
      if (this.isNormalTab(tab))
        tabs.push(tab);
    }
    for (let tab = aTab; (tab = tab.previousSibling) && tab.getAttribute("group") == aTab.getAttribute("group");) {
      if (this.isNormalTab(tab))
        tabs.unshift(tab);
    }
    return tabs;
  };

  gBrowser.previousSiblingTabOf = function previousSiblingTabOf(aTab) this.nextSiblingTabOf(aTab, -1);
  gBrowser.nextSiblingTabOf = function nextSiblingTabOf(aTab, aDir) {
    let next = aDir < 0 ? "previousSibling" : "nextSibling";
    for (let tab = aTab; (tab = tab[next]) && tab.getAttribute("group") == aTab.getAttribute("group");) {
      if (this.isNormalTab(tab))
        return tab;
    }
  };

  gBrowser.firstSiblingTabOf = function firstSiblingTabOf(aTab) this.lastSiblingTabOf(aTab, -1);
  gBrowser.lastSiblingTabOf = function lastSiblingTabOf(aTab, aDir) {
    let next = aDir < 0 ? "previousSibling" : "nextSibling";
    for (let tab = aTab; (tab = tab[next]) && tab.getAttribute("group") == aTab.getAttribute("group");) {
      if (this.isNormalTab(tab))
        aTab = tab;
    }
    return aTab;
  };

  gBrowser.groupTabs = function groupTabs(aTabs, aTab, aExpand) {
    aTabs = aTabs.filter(function(aTab) !aTab.hasAttribute("pinned"))
                 .sort(function(aTab, bTab) aTab._tPos - bTab._tPos);
    if (aTabs.length < 2)
      return;

    if (!aTab)
      aTab = aTabs[0];

    this.selectedTabs = [];
    this.ungroupTabs(aTabs, aTab.hasAttribute("group") && !aTab.hasAttribute("group-first") && !aTab.hasAttribute("group-last"));
    this.gatherTabs(aTabs, aTab, true);

    for (let tab of aTabs) {
      this.attachTabTo(tab, aTab, {expand: aExpand, suppressUpdate: true});
    }
    this.updateGroup(aTab);
  };

  gBrowser.ungroupTabs = function ungroupTabs(aTabs, aMove) {
    aMove = aMove != false;
    for (let i = 0; i < aTabs.length; i++) {
      if (aTabs[i].hasAttribute("group-first"))
        this.detachTab(aTabs[i]);
    }
    for (let i = aTabs.length - 1; i >= 0; i--)
      this.detachTab(aTabs[i], aMove);
  };

  gBrowser.attachTabTo = function attachTabTo(aTab, bTab, options) {
    if (aTab == bTab || aTab.hasAttribute("pinned") || bTab.hasAttribute("pinned"))
      return;

    if (!options)
      options = {};

    if (aTab.hasAttribute("group"))
      this.detachTab(aTab);

    if (!bTab.hasAttribute("group")) {
      bTab.setAttribute("group", Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID());
      bTab.setAttribute("group-counter", 1);
    }

    if (bTab.getAttribute("group-counter") == 1) {
      bTab.setAttribute("group-collapsed", !options.expand && TU_getPref("extensions.tabutils.autoCollapseNewStack", true));
      this.mTabContainer.mTabstrip.ensureElementIsVisible(bTab);
    }

    //must happen after "group" is set to avoid bypassing group, and
    //before "group-counter" is set to avoid moving group, if TabMove event is not suppressed
    if (options.move) {
      aTab._suppressTabMove = true;
      switch (options.move) {
        case "start":
          this.moveTabBefore(aTab, this.firstSiblingTabOf(bTab));
          break;
        case "end":
          this.moveTabAfter(aTab, this.lastSiblingTabOf(bTab));
          break;
        case "before":
          this.moveTabBefore(aTab, bTab);
          break;
        default:
          this.moveTabAfter(aTab, bTab);
          break;
      }
      delete aTab._suppressTabMove;
    }

    aTab.setAttribute("group", bTab.getAttribute("group"));
    if (aTab.getAttribute("opener") != bTab.linkedPanel)
      aTab.setAttribute("opener", bTab.getAttribute("opener") || bTab.linkedPanel);

    if (!options.suppressUpdate)
      this.updateGroup(bTab);
    tabutils.dispatchEvent(aTab, "TabStacked", true, false);
  };

  gBrowser.detachTab = function detachTab(aTab, aMove) {
    if (!aTab.hasAttribute("group"))
      return;

    if (aMove && !aTab.hasAttribute("group-first") && !aTab.hasAttribute("group-last")) {
      aTab._suppressTabMove = true;
      this.moveTabAfter(aTab, this.lastSiblingTabOf(aTab));
      this.mTabContainer._notifyBackgroundTab(aTab);
      delete aTab._suppressTabMove;
    }
    this.updateGroup(aTab, {excludeSelf: true});
    tabutils.dispatchEvent(aTab, "TabUnstacked", true, false);

    tabutils.removeAttribute(aTab, "group");
    tabutils.removeAttribute(aTab, "group-color");
    tabutils.removeAttribute(aTab, "group-collapsed");
    tabutils.removeAttribute(aTab, "group-counter");
    aTab.removeAttribute("group-first");
    aTab.removeAttribute("group-last");

    aTab.removeAttribute("opener");
    if (aTab.selected)
      this.updateCurrentBrowser(true);
  };

  gBrowser.collapseGroup = function collapseGroup(aTab) {
    if (!aTab.hasAttribute("group"))
      return;

    if (aTab.getAttribute("group-collapsed") == "true")
      return;

    let tabs = this.siblingTabsOf(aTab);
    for (let tab of tabs) {
      tabutils.setAttribute(tab, "group-collapsed", true);
      if (tab.hasAttribute("group-counter"))
        aTab = tab;
    }

    let tabcontent = document.getAnonymousElementByAttribute(aTab, "class", "tab-content");
    if (tabcontent)
      tabcontent.setAttribute("group-counter", "(" + tabs.length + ")");

    tabutils.dispatchEvent(aTab, "StackCollapsed", true, false);
    this.mTabContainer.adjustTabstrip();
  };

  gBrowser.expandGroup = function expandGroup(aTab) {
    if (!aTab.hasAttribute("group"))
      return;

    if (aTab.getAttribute("group-collapsed") != "true")
      return;

    let tabs = this.siblingTabsOf(aTab);
    for (let tab of tabs) {
      tabutils.removeAttribute(tab, "group-collapsed");
      if (tab.hasAttribute("group-counter"))
        aTab = tab;
    }
    tabutils.dispatchEvent(aTab, "StackExpanded", true, false);
    this.mTabContainer.adjustTabstrip();
    this.mTabContainer.mTabstrip.ensureElementIsVisible(tabs[tabs.length - 1], false);
    this.mTabContainer.mTabstrip.ensureElementIsVisible(tabs[0], false);
  };

  gBrowser.updateGroup = function updateGroup(aTab, options) {
    if (!aTab.hasAttribute("group"))
      return;

    if (!options)
      options = {};

    let tabs = this.siblingTabsOf(aTab, true);
    if (options.excludeSelf) {
      let index = tabs.indexOf(aTab);
      if (index > -1)
        tabs.splice(index, 1);
    }
    if (tabs.length == 0)
      return;

    if (!aTab.selected && !aTab.hasAttribute("group-counter") || tabs.indexOf(aTab) == -1) {
      aTab = tabs[0];
      for (let i = 1; i < tabs.length; i++) {
        if (tabs[i].hasAttribute("group-counter")) {
          aTab = tabs[i];
          break;
        }
      }
    }

    let group = options.id ? Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString()
                           : aTab.getAttribute("group");
    let color = "color" in options ? options.color : aTab.getAttribute("group-color");
    let collapsed = aTab.getAttribute("group-collapsed") == "true";
    for (let tab of tabs) {
      tabutils.setAttribute(tab, "group", group);
      tabutils.setAttribute(tab, "group-color", color);
      tabutils.setAttribute(tab, "group-collapsed", collapsed);
      tabutils.removeAttribute(tab, "group-counter");
      tab.removeAttribute("group-first");
      tab.removeAttribute("group-last");
    }
    tabutils._tabPrefObserver.updateGroupColor(group, color);

    if (!aTab.selected && tabs.indexOf(this.mCurrentTab) > -1)
      aTab = this.mCurrentTab;

    tabutils.setAttribute(aTab, "group-counter", tabs.length);
    tabs[0].setAttribute("group-first", true);
    tabs[tabs.length - 1].setAttribute("group-last", true);

    let tabcontent = document.getAnonymousElementByAttribute(aTab, "class", "tab-content");
    if (tabcontent)
      tabcontent.setAttribute("group-counter", "(" + tabs.length + ")");
  };

  tabutils.addEventListener(gBrowser.mTabContainer, "dragover", function(event) {
    let tab = event.target.localName == "tab" ? event.target : null;
    if (tab && tab.getAttribute("group-collapsed") == "true" &&
        tab.getAttribute("group-counter") != 1 &&
        TU_getPref("extensions.tabutils.autoExpandStackOnDragover", true)) {
      if (!this._dragTime)
        this._dragTime = Date.now();
      if (Date.now() >= this._dragTime + 750)
        gBrowser.expandGroup(tab);
    }
  }, true);

  tabutils.addEventListener(gBrowser.mTabContainer, "dragover", function(event) {
    if (!TU_getPref("extensions.tabutils.dragToStack", false))
      return;

    let tab = event.target.localName == "tab" ? event.target : null;
    if (!tab || tab.hasAttribute("pinned"))
      return;

    let dt = event.dataTransfer;
    let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
    if (!draggedTab || draggedTab == tab || draggedTab.hasAttribute("pinned") || draggedTab.parentNode != this)
      return;

    let dropEffect = dt.dropEffect;
    if (dropEffect == "link" || dropEffect == "copy") {
      tab.removeAttribute("dragover");
      return;
    }

    let vertical = this.orient == "vertical";
    let [start, end] = vertical ? ["top", "bottom"] : ["left", "right"];
    let [position, size] = vertical ? ["screenY", "height"] : ["screenX", "width"];

    if (event[position] < tab.boxObject[position] + tab.boxObject[size] * .25)
      tab.setAttribute("dragover", start);
    else if (event[position] > tab.boxObject[position] + tab.boxObject[size] * .75)
      tab.setAttribute("dragover", end);
    else {
      tab.setAttribute("dragover", "center");
      this._tabDropIndicator.collapsed = true;
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  tabutils.addEventListener(gBrowser.mTabContainer, "drop", function(event) {
    let tab = event.target.localName == "tab" ? event.target : null;
    if (!tab || !tab.hasAttribute("dragover"))
      return;

    let move;
    switch (tab.getAttribute("dragover")) {
      case "left":
      case "top":
        if (!tab.hasAttribute("group-first") || tab.getAttribute("group-collapsed") == "true")
          return;
        move = "before";
        break;
      case "right":
      case "bottom":
        if (!tab.hasAttribute("group-last") || tab.getAttribute("group-collapsed") == "true")
          return;
        move = "after";
        break;
      default:
        if (tab.getAttribute("group-collapsed") == "true" && tab.getAttribute("group-counter") > 1)
          move = "end";
        else
          move = "group";
        break;
    }

    tab.removeAttribute("dragover");
    this._tabDropIndicator.collapsed = true;
    event.stopPropagation();

    let dt = event.dataTransfer;
    let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);
    let draggedTabs = [draggedTab];
    for (let i = 1; i < dt.mozItemCount; i++) {
      let tab = dt.mozGetDataAt(TAB_DROP_TYPE, i);
      if (tab._tPos < draggedTab._tPos)
        draggedTabs.splice(-1, 0, tab);
      else
        draggedTabs.push(tab);
    }

    if (move == "group") {
      gBrowser.groupTabs(draggedTabs.concat(tab), tab);
      return;
    }

    gBrowser.selectedTabs = [];
    gBrowser.ungroupTabs(draggedTabs, false);
    gBrowser.attachTabTo(draggedTabs[0], tab, {move: move, expand: true, suppressUpdate: true});
    for (let i = 1; i < draggedTabs.length; i++) {
      gBrowser.attachTabTo(draggedTabs[i], draggedTabs[i - 1], {move: true, suppressUpdate: true});
    }
    gBrowser.updateGroup(tab);
  }, true);

  tabutils.addEventListener(gBrowser.mTabContainer, "dragleave", function(event) {
    this._dragTime = 0;
    if (event.target.localName == "tab")
      event.target.removeAttribute("dragover");
  }, true);

  tabutils.addEventListener(gBrowser.mTabContainer, "dragend", function(event) { //Bug 460801
    Array.forEach(this.childNodes, function(aTab) aTab.removeAttribute("dragover"));
  }, true);

  TU_hookCode("gBrowser.onTabMove", "}", function() {
    let ltr = aTab._tPos > event.detail;
    let previousTab = ltr ? aTab.previousSibling : aTab.nextSibling;
    let nextTab = ltr ? aTab.nextSibling : aTab.previousSibling;

    if (aTab.hasAttribute("group") && aTab.getAttribute("group-counter") != 1 && !aTab.hidden) {
      if (aTab.getAttribute("group-collapsed") == "true" && aTab.hasAttribute("group-counter")) {
        let tabs = this.siblingTabsOf(aTab, true);
        tabs.splice(tabs.indexOf(aTab), 1);

        let index = 0;
        let oldPos = ltr ? event.detail - 0.5 : event.detail + 0.5;
        while (index < tabs.length && tabs[index]._tPos < oldPos)
          index++;
        tabs.splice(index, 0, aTab);

        setTimeout(function(self) { //gather group
          let selectedTabs = self.selectedTabs;
          self.selectedTabs = [];
          self.gatherTabs(tabs, aTab);
          self.selectedTabs = selectedTabs;
        }, 0, this);
      }
      else if (aTab.getAttribute("group") == previousTab.getAttribute("group") || nextTab &&
               aTab.getAttribute("group") == nextTab.getAttribute("group"))
        this.updateGroup(aTab);
      else
        this.detachTab(aTab);
    }

    if (nextTab && nextTab.hasAttribute("group") &&
        nextTab.getAttribute("group") != aTab.getAttribute("group") &&
        nextTab.getAttribute("group") == previousTab.getAttribute("group")) {
      if (nextTab.getAttribute("group-collapsed") == "true")
        setTimeout(function(self) { //bypass group
          if (ltr)
            self.moveTabAfter(aTab, self.lastSiblingTabOf(nextTab));
          else
            self.moveTabBefore(aTab, self.firstSiblingTabOf(nextTab));
        }, 0, this);
      else {
        if (aTab.getAttribute("group-collapsed") == "true" && aTab.getAttribute("group-counter") > 1)
          this.ungroupTabs(this.siblingTabsOf(aTab, true), false);
        this.attachTabTo(aTab, nextTab);
      }
    }
  });

  TU_hookCode("gBrowser.onTabClosing", "}", function() {
    tabutils.deleteTabValue(aTab, "group-collapsed");
  });

  TU_hookCode("gBrowser.onTabClose", "}", function() {
    if (aTab.selected && aTab.hasAttribute("group") && !aTab.hasAttribute("opener"))
      this.selectedTab = this.nextSiblingTabOf(aTab) || this.previousSiblingTabOf(aTab);

    if (aTab.getAttribute("group-collapsed") == "true" &&
        aTab.getAttribute("group-counter") > 1) {
      aTab.removeAttribute("group-counter");
    }
    this.updateGroup(aTab, {excludeSelf: true});
  });

  TU_hookCode("gBrowser.onTabRestoring", "}", function() {
    tabutils.restoreAttribute(aTab, "group");
    tabutils.restoreAttribute(aTab, "group-color");
    tabutils.restoreAttribute(aTab, "group-collapsed");
    tabutils.restoreAttribute(aTab, "group-counter");
    this.updateGroup(aTab);

    if (aTab.getAttribute("group-collapsed") == "true")
      this.mTabContainer.adjustTabstrip();
  });

  TU_hookCode("gBrowser.onTabSelect", "}", function() {
    if (aTab.hasAttribute("group") && !aTab.hasAttribute("group-counter"))
      this.updateGroup(aTab);

    if (aTab.getAttribute("group-collapsed") == "true" &&
        aTab.getAttribute("group-counter") != 1 &&
        TU_getPref("extensions.tabutils.autoExpandStackAndCollapseOthersOnSelect", true)) {
      Array.forEach(this.mTabs, function(aTab) {
        if (aTab.getAttribute("group-counter") > 1 && !aTab.hidden && !aTab.selected)
          this.collapseGroup(aTab);
      }, this);
      this.expandGroup(aTab);
      this.mTabContainer.mTabstrip.ensureElementIsVisible(this.mCurrentTab, false);
    }

    let lastTab = this.getLastSelectedTab();
    if (lastTab && lastTab.hasAttribute("group") &&
        lastTab.getAttribute("group") != aTab.getAttribute("group") &&
        TU_getPref("extensions.tabutils.autoCollapseStackOnBlur", false))
      this.collapseGroup(lastTab);
  });

  TU_hookCode("gBrowser.onTabPinning", "}", function() {
    this.detachTab(aTab);
  });

  gBrowser.showOnlyTheseTabs = function showOnlyTheseTabs(aTabs) {
    Array.reduceRight(this.mTabs, function(self, aTab) {
      if (aTabs.indexOf(aTab) == -1)
        this.hideTab(aTab);
    }.bind(this), this);
    Array.reduce(this.mTabs, function(self, aTab) {
      if (aTabs.indexOf(aTab) > -1)
        this.showTab(aTab);
    }.bind(this), this);
    this.tabContainer.mTabstrip.ensureElementIsVisible(this.selectedTab, false);
  };

  TU_hookCode("gBrowser.onTabHide", "}", function() {
    this.updateGroup(aTab, {excludeSelf: true});
  });

  TU_hookCode("gBrowser.onTabShow", "}", function() {
    this.updateGroup(aTab);
  });

  TU_hookCode("gBrowser.loadTabs",
    [/(?=var tabNum)/, "var tabs = [firstTabAdded || this.mCurrentTab];"],
    [/(?=.*aReplace.*\n.*moveTabTo.*)/, "tabs.push(tab);"],
    [/(?=.*!aLoadInBackground.*)/, function() {
      if (tabs.length > 1 && TU_getPref("extensions.tabutils.autoStack", false))
        this.groupTabs(tabs);
    }]
  );

  TU_hookCode("gBrowser.mTabContainer._selectNewTab", "aNewTab.disabled",
    "$& || aNewTab.getAttribute('group-collapsed') == 'true' && !aNewTab.hasAttribute('group-counter')"
  );

  TU_hookCode("gBrowser.createTooltip", /(tab|tn).getAttribute\("label"\)/, <![CDATA[
    $1.mOverTwisty ? $1.getAttribute("group-collapsed") == "true" ?
                     document.getElementById("context_expandGroup").getAttribute("label") :
                     document.getElementById("context_collapseGroup").getAttribute("label")
                   : $1.getAttribute("group-collapsed") == "true" && $1.getAttribute("group-counter") != 1 ?
                     TU_getPref("extensions.tabutils.mouseHoverPopup", true) ?
                     event.preventDefault() :
                     this.siblingTabsOf($1).map(function($1) ($1.hasAttribute("group-counter") ? "> " : "# ") + $&).join("\n") :
                     $&
  ]]>);

  if (gBrowser.mTabContainer.mAllTabsPopup)
  TU_hookCode("gBrowser.mTabContainer.mAllTabsPopup._setMenuitemAttributes",
    ["aTab.selected", '$& || aTab.hasAttribute("group-counter") && arguments.callee.caller == gBrowser.updateTabStackPopup']
  );

  gBrowser.updateTabStackPopup = function updateTabStackPopup(aPopup) {
    while (aPopup.hasChildNodes())
      aPopup.removeChild(aPopup.lastChild);

    let tabs = this.siblingTabsOf(this.mTabs[aPopup.value]);
    for (let tab of tabs) {
      let item = document.createElement("menuitem");
      item.setAttribute("class", "menuitem-iconic alltabs-item menuitem-with-favicon");
      item.setAttribute("label", tab.label);
      item.setAttribute("crop", tab.crop);

      if (tab.hasAttribute("busy"))
        item.setAttribute("busy", "true");
      else
        item.setAttribute("image", tab.image);

      if (tab.hasAttribute("group-counter"))
        item.setAttribute("selected", "true");

      if (gBrowser.mTabContainer.mAllTabsPopup)
        gBrowser.mTabContainer.mAllTabsPopup._setMenuitemAttributes(item, tab);

      item.value = tab._tPos;
      aPopup.appendChild(item);
    }
  };

  tabutils.addEventListener(gBrowser.mTabContainer, "TabAttrModified", function(event) {
    let popup = document.getElementById("tabStackPopup");
    if (popup.state != "open")
      return;

    let tab = event.target;
    for (let item of popup.childNodes) {
      if (item.value == tab._tPos) {
        gBrowser.mTabContainer.mAllTabsPopup._setMenuitemAttributes(item, tab);
        break;
      }
    }
  }, false);

  tabutils.addEventListener(gBrowser.mTabContainer, "mouseover", function(event) {
    if (event.target.localName == "tab" &&
        event.target.getAttribute("group-collapsed") == "true" &&
        event.target.getAttribute("group-counter") != 1 &&
        TU_getPref("extensions.tabutils.mouseHoverPopup", true)) {
      let tab = event.target;
      let target = event.relatedTarget;
      while (target && target != tab)
        target = target.parentNode;
      if (target)
        return;

      let popup = document.getElementById("tabStackPopup");
      clearTimeout(popup._mouseHoverTimer);

      popup.hidePopup();
      popup._mouseHoverTimer = setTimeout(function(self) {
        popup.value = tab._tPos;
        popup.openPopup(tab, self.orient == "horizontal" ? "after_start" : "end_before");
      }, TU_getPref("extensions.tabutils.mouseHoverPopupDelay", 250), this);
    }
  }, false);

  tabutils.addEventListener(gBrowser.mTabContainer, "mouseout", function(event) {
    if (event.target.localName == "tab") {
      let tab = event.target;
      let target = event.relatedTarget;
      while (target && target != tab)
        target = target.parentNode;
      if (target)
        return;

      let popup = document.getElementById("tabStackPopup");
      clearTimeout(popup._mouseHoverTimer);
      popup._mouseHoverTimer = setTimeout(function(self) {
        popup.hidePopup();
      }, 250, this);
    }
  }, false);

  tabutils.addEventListener(gBrowser.mTabContainer, "mousedown", function(event) {
    if (event.target.localName == "tab") {
      let popup = document.getElementById("tabStackPopup");
      clearTimeout(popup._mouseHoverTimer);
      popup.hidePopup();
    }
  }, false);

  tabutils.addEventListener(document.getElementById("tabStackPopup"), "mouseover", function(event) {
    clearTimeout(this._mouseHoverTimer);
  }, false);

  tabutils.addEventListener(document.getElementById("tabStackPopup"), "mouseout", function(event) {
    this._mouseHoverTimer = setTimeout(function(self) {
      self.hidePopup();
    }, 250, this);
  }, false);
};

tabutils._tabClickingOptions = function() {

  //���������URL
  gBrowser.loadURLFromClipboard = function loadURLFromClipboard(aTab) {
    var url = readFromClipboard();
    if (!url)
      return;

    if (aTab) {
      aTab.linkedBrowser.stop();
      aTab.linkedBrowser.loadURIWithFlags(url, Ci.nsIWebNavigation.LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP);
    }
    else {
      this.loadOneTab(url, null, null, null, TU_getPref('extensions.tabutils.loadNewInBackground', false), true);
    }
  };

  //�����ʷ�˵�
  TU_hookCode("FillHistoryMenu",
    ["count <= 1", "count == 0"],
    [/(?=var webNav)/, function() {
      var tab = document.popupNode;
      if (!tab || tab.localName != 'tab')
        tab = gBrowser.selectedTab;
      aParent.value = tab._tPos;
    }],
    ["gBrowser.webNavigation", "tab.linkedBrowser.webNavigation"]
  );
  TU_hookCode("gotoHistoryIndex",
    ["gBrowser.selectedTab", "tab", "g"],
    ["gBrowser", "tab.linkedBrowser", "g"],
    [/(?=let where)/, "let tab = gBrowser.mTabs[aEvent.target.parentNode.value];"]
  );

  TU_hookCode("gBrowser.mTabContainer._selectNewTab", "{", function() {
    if (["setTab", "onxblmousedown"].indexOf(arguments.callee.caller && arguments.callee.caller.name) > -1 &&
        !aNewTab.selected) // Bug 743877 [Fx15]
      aNewTab.setAttribute("firstclick", true);
  });

  gBrowser.onTabClick = function onTabClick(event) {
    if (event.target.hasAttribute("firstclick")) {
      event.target.removeAttribute("firstclick");
      if (event.button == 0 && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey)
        return;
    }

    if (event.altKey) {
      window.addEventListener("keyup", function(event) {
        if (event.keyCode == event.DOM_VK_ALT) {
          window.removeEventListener("keyup", arguments.callee, true);
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    }

    var type = [
      event.ctrlKey || event.metaKey ? "Ctrl" : "",
      event.altKey ? "Alt" : "",
      event.shiftKey ? "Shift" : "",
      event.button == 1 ? "Middle" : event.button == 2 ? "Right" : ""
    ].join("").replace(/./, function(s) s.toLowerCase());

    if (type) {
      this.doClickAction(type, event);
    }
    else if (event.detail == 1 && !event.target.mOverCloseButton) {
      event.target._leftClickTimer = setTimeout(function(self) {
        self.doClickAction("left", event);
      }, TU_getPref("extensions.tabutils.leftClickTabDelay", 250), this);
    }
  };

  gBrowser.onTabBarDblClick = function onTabBarDblClick(event) {
    if (event.button == 0 && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey
        && !this._blockDblClick && !gBrowser._blockDblClick) {
      clearTimeout(event.target._leftClickTimer);
      this.doClickAction("dbl", event);
    }
  };

  gBrowser._getTargetTab = function _getTargetTab(event) {
    if (event.target.localName == "tab")
      return event.target;

    for (let target = event.originalTarget; target; target = target.parentNode) {
      switch (target.localName) {
        case "tab":
        case "tabs": return target;
        case "menuitem": return target.tab;
        case "toolbarbutton": return target.command == "cmd_newNavigatorTab" ? target : null;
      }
    }
    return null;
  };

  gBrowser.doClickAction = function doClickAction(type, event) {
    var target = this._getTargetTab(event);
    if (!target)
      return;

    var tab = target.localName == "tab" ? target : gBrowser.mCurrentTab;
    TabContextMenu.contextTab = tab;

    gBrowser.mContextTabs = gBrowser.contextTabsOf(gBrowser.mContextTab);

    var prefName = target.localName == "tab" ? "ClickTab" :
                   target.localName == "tabs" ? "ClickTabBar" : "ClickNewTabButton";
    var action = TU_getPref("extensions.tabutils." + type + prefName, 0);
    var code = TU_getPref("extensions.tabutils.mouse." + action + ".oncommand");
    if (code) {
      try {
        new Function("event", code)(event);
      }
      catch (e) {}

      event.preventDefault();
      event.stopPropagation();
      return;
    }

    function $() document.getElementById.apply(document, arguments);

    switch (action) {
      case 0: //Default
        return;
      case 1: //New Tab
        BrowserOpenTab();
        break;
      case 2: //Duplicate Tab
        $("context_duplicateTab").doCommand();
        break;
      case 3: //Reload Tab
        $("context_reloadTab").doCommand();
        break;
      case 4: //Close Tab
        $("context_closeTab").doCommand();
        break;
      case 5: //Undo Close Tab
        undoCloseTab();
        break;
      case 6: //Load URL from Clipboard
        gBrowser.loadURLFromClipboard(target.localName == "tab" ? gBrowser.mContextTab : null);
        break;
      case 7: //Switch to Last Selected Tab
        if (gBrowser.mContextTab.selected) {
          gBrowser.selectedTab = gBrowser.getLastSelectedTab();
        }
        break;
      case 11: //Session History Menu
        var backForwardMenu = $("backForwardMenu");
        document.popupNode = target;
        backForwardMenu.setAttribute("onpopuphidden", "if (event.target == this) document.popupNode = null;");
        backForwardMenu.openPopupAtScreen(event.screenX, event.screenY, true);
        break;
      case 12: //Recently Closed Tabs
        $("undoCloseTabPopup").openPopupAtScreen(event.screenX, event.screenY, true);
        break;
      case 13: //List All Tabs
        var allTabsPopup = gBrowser.mTabContainer.mAllTabsPopup;
        if (allTabsPopup) {
          allTabsPopup.openPopupAtScreen(event.screenX, event.screenY, true);
        }
        break;
      case 14: //Tab Context Menu
        var tabContextMenu = gBrowser.tabContextMenu;
        document.popupNode = target;
        tabContextMenu.setAttribute("onpopuphidden", "if (event.target == this) document.popupNode = null;");
        tabContextMenu.openPopupAtScreen(event.screenX, event.screenY, true);
        break;
      case 16: //Toolbar Context Menu
        $("toolbar-context-menu").openPopupAtScreen(event.screenX, event.screenY, true);
        break;
      case 15: //Bookmarks
        $("bookmarksPopup").openPopupAtScreen(event.screenX, event.screenY, false);
        break;
      case 21: //Protect Tab
        $("context_protectTab").doCommand();
        break;
      case 22: //Lock Tab
        $("context_lockTab").doCommand();
        break;
      case 23: //Freeze Tab
        $("context_freezeTab").doCommand();
        break;
      case 24: //Faviconize Tab
        $("context_faviconizeTab").doCommand();
        break;
      case 25: //Pin Tab
        $("context_pegTab").doCommand();
        break;
      case 26: //Hide Tab
        $("context_hideTab").doCommand();
        break;
      case 27: //Rename Tab
        $("context_renameTab").doCommand();
        break;
      case 28: //Restart Tab
        $("context_restartTab").doCommand();
        break;
      case 29: //Reload Tab Every
        $("context_reloadEvery").getElementsByAttribute("anonid", "enable")[0].doCommand();
        break;
      case 31: //Select a Tab
        $("context_selectTab").doCommand();
        break;
      case 32: //Select Multiple Tabs
        $("context_selectTabs").doCommand();
        break;
      case 33: //Select Multiple Tabs (+)
        gBrowser.selectTabs(gBrowser.mContextTab, true);
        break;
      case 34: //Select All Tabs
        $("context_selectAllTabs").doCommand();
        break;
      case 35: //Unselect All Tabs
        $("context_unselectAllTabs").doCommand();
        break;
      case 36: //Invert Selection
        $("context_invertSelection").doCommand();
        break;
      case 37: //Select Similar Tabs
        gBrowser.selectedTabs = gBrowser.similarTabsOf(gBrowser.mContextTabs);
        break;
      case 41: //Close Left Tabs
        $("context_closeLeftTabs").doCommand();
        break;
      case 42: //Close Right Tabs
        $("context_closeRightTabs").doCommand();
        break;
      case 43: //Close Other Tabs
        $("context_closeOtherTabs").doCommand();
        break;
      case 44: //Close Duplicate Tabs
        $("context_closeDuplicateTabs").doCommand();
        break;
      case 45: //Close Similar Tabs
        $("context_closeSimilarTabs").doCommand();
        break;
      case 46: //Close All Tabs
        $("context_closeAllTabs").doCommand();
        break;
      case 51: //Collapse/Expand Stack
        if (gBrowser.mContextTab.getAttribute("group-collapsed") == "true")
          $("context_expandGroup").doCommand();
        else
          $("context_collapseGroup").doCommand();
        break;
      case 52: //Recolor Stack
        $("context_colorGroup").doCommand();
        break;
      default: //Do Nothing
        break;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  gBrowser.mTabContainer.setAttribute("onclick", "if (event.button == 0) gBrowser.onTabClick(event);");
  gBrowser.mTabContainer.setAttribute("ondblclick", "gBrowser.onTabBarDblClick(event);");
  tabutils.addEventListener(gBrowser.mTabContainer, "MozMouseHittest", function(event) {if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey || event.detail > 0) event.stopPropagation();}, true);
  tabutils.addEventListener(gBrowser.mTabContainer, "click", function(event) {if (event.button == 1) gBrowser.onTabClick(event);}, true);
  tabutils.addEventListener(gBrowser.mTabContainer, "contextmenu", function(event) {if (event.button == 2) gBrowser.onTabClick(event);}, true);
  tabutils.addEventListener(gBrowser.mTabContainer, "dblclick", function(event) {if (event.target.localName == "tabs") gBrowser.onTabBarDblClick(event);}, true);

  //Mouse release to select
  TU_hookCode("gBrowser.mTabContainer._selectNewTab", "{", function() {
    if (["setTab", "onxblmousedown"].indexOf(arguments.callee.caller && arguments.callee.caller.name) > -1 &&
        TU_getPref("extensions.tabutils.mouseReleaseSelect", true)) // Bug 743877 [Fx15]
      return;
  });

  TU_hookCode("gBrowser.onTabClick", "{", function() {
    if (event.button == 0 && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey
        && event.target.localName == "tab" && !event.target.selected && !event.target.mOverCloseButton) {
      this.mTabContainer._selectNewTab(event.target);
      return;
    }
  });

  //Mouse hover to select
  gBrowser.mTabContainer._mouseHoverSelectTimer = null;
  tabutils.addEventListener(gBrowser.mTabContainer, 'mouseover', function(event) {
    if (event.target.localName == 'tab' && !event.target.selected && TU_getPref("extensions.tabutils.mouseHoverSelect", false)) {
      clearTimeout(this._mouseHoverSelectTimer);
      this._mouseHoverSelectTimer = setTimeout(function(aTab) {
        if (aTab && !aTab.mOverCloseButton)
          gBrowser.selectedTab = aTab;
      }, TU_getPref("extensions.tabutils.mouseHoverSelectDelay", 250), event.target);
    }
  }, false);

  tabutils.addEventListener(gBrowser.mTabContainer, 'mouseout', function(event) {
    if (event.target.localName == 'tab') {
      clearTimeout(this._mouseHoverSelectTimer);
      this._mouseHoverSelectTimer = null;
    }
  }, false);

  //Mouse scroll to select
  tabutils.addEventListener(gBrowser.mTabContainer, 'DOMMouseScroll', function(event) {
    if (event.ctrlKey) {
      document.getElementById(event.detail < 0 ? "cmd_prevGroup" : "cmd_nextGroup").doCommand();
      event.stopPropagation();
      return;
    }

    if (event.originalTarget != this.mTabstrip._scrollButtonUp &&
        event.originalTarget != this.mTabstrip._scrollButtonDown &&
        TU_getPref("extensions.tabutils.mouseScrollSelect", false)) {
      let scrollDir = event.detail < 0 ^ TU_getPref("extensions.tabutils.mouseScrollSelectDir", false) ? -1 : 1;
      this.advanceSelectedTab(scrollDir, TU_getPref("extensions.tabutils.mouseScrollSelectWrap", false));
      event.stopPropagation();
    }
  }, true);

  //Center current tab
  TU_hookCode("gBrowser.onTabSelect", "}", function() {
    if (TU_getPref("extensions.tabutils.centerCurrentTab", false)) {
      let tabStrip = this.mTabContainer.mTabstrip;
      let scrollRect = tabStrip.scrollClientRect;
      let tabRect = aTab.getBoundingClientRect();
      let [start, end] = tabStrip._startEndProps;
      tabStrip._stopSmoothScroll();
      tabStrip.scrollPosition += (tabRect[start] + tabRect[end])/2 - (scrollRect[start] + scrollRect[end])/2;
    }
  });
};

//Multi-row tabs
tabutils._multirowTabs = function() {
  gBrowser.mTabContainer.enterBlockMode = function enterBlockMode() {
    if (this.orient == "horizontal" && this.getAttribute("overflow") == "true" && this.getAttribute("showAllTabs") == "true") {
      this.mTabstrip._lineHeight = this.mTabstrip.boxObject.height;
      this.setAttribute("multirow", true);
      this._revertTabSizing();

      let evt = document.createEvent("UIEvent");
      evt.initUIEvent("underflow", true, false, window, 1);
      this.mTabstrip._scrollbox.dispatchEvent(evt);
    }
  };

  gBrowser.mTabContainer.exitBlockMode = function exitBlockMode() {
    if (!this.hasAttribute("multirow"))
      return;

    if (this.orient == "horizontal" &&
        this.getAttribute("showAllTabs") == "true" &&
        (this.getAttribute("overflow") == "true" || this.mTabstrip.boxObject.height / this.mTabstrip._lineHeight > 1.35))
      return;

    this.removeAttribute("multirow");
    this.stylePinnedTabs();
  };

  tabutils.addEventListener(gBrowser.mTabContainer, "overflow", function(event) {
    this.enterBlockMode();
  }, false);

  tabutils.addEventListener(gBrowser.mTabContainer, "TabClose", function(event) {
    setTimeout(function(self) {
      self.exitBlockMode();
    }, 250, this);
  }, false);

  tabutils.addEventListener(window, "resize", function(event) {
    gBrowser.mTabContainer.exitBlockMode();
    if (window.fullScreen && FullScreen._isChromeCollapsed && !document.getElementById("nav-bar").hasAttribute("moz-collapsed")) //Fx 4.0+
      gNavToolbox.style.marginTop = -gNavToolbox.getBoundingClientRect().height + "px";
  }, false);

  TU_hookCode("gBrowser.mTabContainer._getDropIndex",
    [/event.screenX.*width \/ 2/g, function(s) s + "&&" + s.replace("screenX", "screenY", "g").replace("width / 2", "height")
                                                 + "||" + s.replace("screenX", "screenY", "g").replace("width / 2", "height * 0")]
  );

  tabutils.addEventListener(gBrowser.mTabContainer, "dragover", function(event) {
    var ind = this._tabDropIndicator.parentNode;
    if (!this.hasAttribute("multirow")) {
      ind.style.position = "";
      return;
    }
    ind.style.position = "fixed";
    ind.style.zIndex = 100;

    var newIndex = this._getDropIndex(event);
    var tab = this.childNodes[newIndex < this.childNodes.length ? newIndex : newIndex - 1];
    var ltr = getComputedStyle(this, null).direction == "ltr";
    var [start, end] = ltr ? ["left", "right"] : ["right", "left"];
    var startPos = this.getBoundingClientRect()[start];
    if (tab.boxObject.screenY > event.screenY && newIndex > 0) {
      tab = this.childNodes[newIndex - 1];
      startPos += tab.getBoundingClientRect()[end] - this.mTabstrip._scrollbox.getBoundingClientRect()[start];
    }
    ind.style[start] = startPos - ind.clientWidth / 2 * (ltr ? 1 : -1) + "px";

    ind.style.top = tab.getBoundingClientRect().top + "px";
    ind.style.lineHeight = tab.getBoundingClientRect().height + "px";
    ind.firstChild.style.verticalAlign = "bottom";
  }, true);

  TU_hookCode("gBrowser.mTabContainer._animateTabMove", "{", function() {
    if (TU_getPref("extensions.tabutils.disableTabMoveAnimation", true)) {
      TU_hookFunc(arguments.callee.caller.toString().match(/^.*{|var (ind|tabStrip|ltr).*|var pixelsToScroll[\s\S]*$/g).join("\n"),
        [/.*scrollByPixels.*/, ";"],
        [/.*effects == "move"[\s\S]*?(?=var (newIndex|scrollRect|rect))/, ""]
      ).apply(this, arguments);
      return;
    }
  });

  tabutils.addEventListener(gBrowser.mTabContainer, "drop", function(event) {
    if (!TU_getPref("extensions.tabutils.disableTabMoveAnimation", true))
      return;

    let dt = event.dataTransfer;
    let dropEffect = dt.dropEffect;
    let draggedTab = dt.mozGetDataAt(TAB_DROP_TYPE, 0);

    if (dropEffect == "move" && draggedTab && draggedTab.parentNode == this) {
      draggedTab._dragData.animDropIndex = this._getDropIndex(event);
    }
  }, true);

  TU_hookCode("gBrowser.moveTabTo", "{", function() {
    if (["onxbldrop", "ondrop"].indexOf(arguments.callee.caller && arguments.callee.caller.name) > -1) {
      if (aTab.pinned) {
        if (aIndex >= this._numPinnedTabs)
          this.unpinTab(aTab);
      } else {
        if (aIndex < this._numPinnedTabs)
          this.pinTab(aTab);
      }
    }
  });

  tabutils.addEventListener(gBrowser.mTabContainer, "dragexit", function(event) {
    this._tabDropIndicator.collapsed = true;
  }, true);

  tabutils.addEventListener(gBrowser.mTabContainer, "dragend", function(event) {
    this._tabDropIndicator.collapsed = true;
  }, true);
};

tabutils._miscFeatures = function() {
  TU_hookCode("gBrowser.onTabOpen", "}", function() { //Bug 615039
    TU_hookCode.call(aTab.linkedBrowser, "loadURIWithFlags", "{", function() {
      try {
        makeURI(aURI);
      }
      catch (e) {
        try {
          if (aURI && aURI.indexOf(".") == -1
              && aFlags & Ci.nsIWebNavigation.LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP
              && TU_getPref("keyword.enabled")
              && TU_getPref("network.dns.ignoreHostonly", false))
            aURI = tabutils._URIFixup.keywordToURI(aURI).spec;
        }
        catch (e) {}
      }
    });
  });

  if ("TreeStyleTabBrowser" in window) //Compatibility with Tree Style Tab
  TU_hookCode("TreeStyleTabBrowser.prototype.positionPinnedTabs", "{", "return;");

  if ("openGMarkLabelInTabs" in window) //Compatibility with GMarks
  TU_hookCode("openGMarkLabelInTabs",
    [/.*openUILinkIn.*/, ""],
    [/(?=.*(labelArray)(?![\s\S]*\1))/, function() {
      var urls = [label.url for (label of labelArray)];
      var loadInBackground = TU_getPref("browser.tabs.loadBookmarksInBackground");
      gBrowser.loadTabs(urls, loadInBackground, false);
    }]
  );

  TU_hookCode("PlacesStarButton._updateStateInternal", /(?=.*this._itemIds.*)/, function() { //Bug 650527
    this._itemIds = this._itemIds.filter(function(itemId) {
      var parentId = PlacesUtils.bookmarks.getFolderIdForItem(itemId);
      var grandparentId = PlacesUtils.bookmarks.getFolderIdForItem(parentId);
      return grandparentId != PlacesUtils.tagsFolderId;
    });
  });

  //Compatibility with themes
  let os = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS; //WINNT, Linux or Darwin
  let version = parseFloat(Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo).version);
  document.documentElement.setAttribute("OS", os);
  document.documentElement.setAttribute("v4", version >= 4.0);
  document.documentElement.setAttribute("v6", version >= 6.0);
  document.documentElement.setAttribute("v14", version >= 14.0);

  for (let i = 0, styleSheet; styleSheet = document.styleSheets[i]; i++) {
    switch (styleSheet.href) {
      case "chrome://browser/skin/browser.css":
        for (let j = 0, cssRule; cssRule = styleSheet.cssRules[j]; j++) {
          if (/> .tabbrowser-tab/.test(cssRule.selectorText)) {
            tabutils.insertRule(cssRule.cssText.replace(RegExp.lastMatch, ".tabbrowser-tab"));
            continue;
          }

          if (/> .tabbrowser-arrowscrollbox > .arrowscrollbox-scrollbox/.test(cssRule.selectorText)) {
            tabutils.insertRule(cssRule.cssText.replace(RegExp.lastMatch, "#PinnedTabsBarItems"));
            continue;
          }

          switch (cssRule.selectorText) {
            case ".tabbrowser-arrowscrollbox > .arrowscrollbox-scrollbox":
              tabutils.insertRule(cssRule.cssText.replace(cssRule.selectorText, ".tabbrowser-tabs[orient='horizontal']:not([overflow]):not([multirow]) $&"))
                      .style.MozMarginStart = "-" + cssRule.style.MozPaddingStart;
              tabutils.insertRule(cssRule.cssText.replace(cssRule.selectorText, "#PinnedTabsBarItems"));
              tabutils.insertRule(cssRule.cssText.replace(cssRule.selectorText, ".tabbrowser-tabs[orient='horizontal']:not([overflow]):not([multirow]) #PinnedTabsBarItems"))
                      .style.MozMarginEnd = "-" + cssRule.style.MozPaddingEnd;
              break;
            case ".tab-throbber[pinned], .tab-icon-image[pinned]":
            case ".tab-throbber[pinned], .tab-icon-image[pinned], .tabs-newtab-button > .toolbarbutton-icon":
              tabutils.insertRule(cssRule.cssText.replace(cssRule.selectorText, ".tabbrowser-tab[faviconized] :-moz-any(.tab-throbber, .tab-icon-image)"));
              break;
          }
        }
        break;
      case "chrome://clrtabs/skin/prefs.css": // Compat. with ColorfulTabs 17.2
        for (let j = 0, cssRule; cssRule = styleSheet.cssRules[j]; j++) {
          switch (cssRule.selectorText) {
            case "tab.tabbrowser-tab .tab-text.tab-label":
              cssRule.style.setProperty("color", cssRule.style.getPropertyValue("color"), "");
              break;
          }
        }
        break;
    }
  }
};

//������Ҽ��˵�
tabutils._mainContextMenu = function() {
  nsContextMenu.prototype.isLinkSelected = function() {
    var focusedWindow = document.commandDispatcher.focusedWindow;
    if (!focusedWindow || focusedWindow == window)
      focusedWindow = window.content;

    var links = focusedWindow.document.links;
    var selection = focusedWindow.getSelection();
    if (!links || !selection)
      return false;

    this.linkURLs = [];
    for (let link of links) {
      if (selection.containsNode(link, true) && this.linkURLs.indexOf(link.href) == -1)
        this.linkURLs.push(link.href);
    }

    var item = document.getElementById("context-openselectedlinksintab");
    item.setAttribute("label", item.getAttribute("label").replace(/\d*(?=])/, this.linkURLs.length));

    return this.linkURLs.length > 1;
  };

  nsContextMenu.prototype.openSelectedLinksInTab = function() {
    this.linkURLs.forEach(function(aURL) openNewTabWith(aURL, this.target.ownerDocument, null, null, false), this);
  };

  //TU_hookCode("nsContextMenu.prototype.initOpenItems", /.*openlinkincurrent.*/, function(s) s.replace("onPlainTextLink", "shouldShow"));
  TU_hookCode("nsContextMenu.prototype.initOpenItems", "}", function() {
    this.showItem("context-openselectedlinksintab", this.isLinkSelected());
  });
};

//��ǩҳ�Ҽ��˵�
tabutils._tabContextMenu = function() {
  function $() {return document.getElementById.apply(document, arguments);}

  var tabContextMenu = gBrowser.tabContextMenu;
  tabContextMenu.insertBefore($("context_closeOtherTabs"), $("context_closeTab").nextSibling);

  Array.slice($("tabContextMenu-template").childNodes).forEach(function(aItem, aIndex, aItems) {
    var refNode;
    switch (true) {
      case aItem.getAttribute("insertafter") != "":
        refNode = tabContextMenu.getElementsByAttribute("id", aItem.getAttribute("insertafter"))[0];
        refNode = refNode && refNode.nextSibling;
        break;
      case aItem.getAttribute("insertbefore") != "":
        refNode = tabContextMenu.getElementsByAttribute("id", aItem.getAttribute("insertbefore"))[0];
        break;
      default:
        refNode = aItems[aIndex - 1] && aItems[aIndex - 1].nextSibling;
        break;
    }
    tabContextMenu.insertBefore(aItem, refNode);
  });

  tabutils.addEventListener(tabContextMenu.parentNode, "popupshowing", function(event) {
    if (event.target != tabContextMenu)
      return;

    for (let item of tabContextMenu.childNodes)
      item.hidden = false;
  }, true);

  tabutils.addEventListener(tabContextMenu.parentNode, "popupshowing", function(event) {
    if (event.target != tabContextMenu)
      return;

    gBrowser.mContextTabs = gBrowser.contextTabsOf(gBrowser.mContextTab);

    var mselected = gBrowser.mContextTab.hasAttribute("multiselected");
    var grouponly = gBrowser.mContextTabs.every(function(aTab) aTab.hasAttribute("group") && aTab.getAttribute("group-counter") != 1);
//    var disableCollapse = grouponly && gBrowser.mContextTabs.every(function(aTab) aTab.getAttribute("group-collapsed") == "true");
//    var disableExpand = grouponly && gBrowser.mContextTabs.every(function(aTab) aTab.getAttribute("group-collapsed") != "true");

    var contextTab = gBrowser.mContextTab;
    $("context_collapseGroup").setAttribute("disabled", contextTab.getAttribute("group-collapsed") == "true");
    $("context_expandGroup").setAttribute("disabled", contextTab.getAttribute("group-collapsed") != "true");
    $("context_splitGroup").setAttribute("disabled", contextTab.getAttribute("group-collapsed") == "true" ||
                                                     contextTab.hasAttribute("group-first") ||
                                                     contextTab.hasAttribute("group-last"));

    var lastVisibleItem = null;
    for (let item of tabContextMenu.childNodes) {
      switch (true) {
        case item.localName == "menuseparator":
          item.hidden = !lastVisibleItem || lastVisibleItem.localName == "menuseparator";
          break;
        case mselected && (item.getAttribute("multiselected") == "false" || item.getAttribute("multiselected") == ""):
        case !mselected && item.getAttribute("multiselected") == "true":
        case !grouponly && item.getAttribute("grouponly") == "true":
          item.hidden = true;
          break;
      }

      if (!item.hidden && !item.collapsed)
        lastVisibleItem = item;
    }
    if (lastVisibleItem && lastVisibleItem.localName == "menuseparator")
      lastVisibleItem.hidden = true;

    var item = $("context_readTab");
    var checked = gBrowser.mContextTabs.every(function(aTab) aTab.getAttribute("unread") != "true");
    item.setAttribute("label", checked ? item.getAttribute("label_checked") : item.getAttribute("label_unchecked"));
    item.setAttribute("checked", checked);
    item.setAttribute("disabled", gBrowser.mContextTabs.every(function(aTab) aTab.selected));

    [
      ["context_protectTab", ["protected"]],
      ["context_lockTab", ["locked"]],
      ["context_freezeTab", ["protected", "locked"]],
      ["context_faviconizeTab", ["faviconized"]],
      ["context_pegTab", ["pinned"]],
      ["context_hideTab", ["concealed"]]
    ].forEach(function([aId, aAttrs]) {
      $(aId).setAttribute("checked", gBrowser.mContextTabs.every(function(aTab) aAttrs.every(function(aAttr) aTab.hasAttribute(aAttr))));
    });

    var autoProtect = TU_getPref("extensions.tabutils.pinTab.autoProtect", false);
    var autoLock = TU_getPref("extensions.tabutils.pinTab.autoLock", false);
    var disableProtect = autoProtect && gBrowser.mContextTabs.every(function(aTab) aTab.hasAttribute("pinned") && !aTab.hasAttribute("protected"));
    var disableLock = autoLock && gBrowser.mContextTabs.every(function(aTab) aTab.hasAttribute("pinned") && !aTab.hasAttribute("locked"));

    if (disableProtect) $("context_protectTab").setAttribute("checked", true);
    if (disableLock) $("context_lockTab").setAttribute("checked", true);
    $("context_freezeTab").setAttribute("checked", $("context_protectTab").getAttribute("checked") == "true"
                                                && $("context_lockTab").getAttribute("checked") == "true");

    $("context_closeTab").setAttribute("disabled", $("context_protectTab").getAttribute("checked") == "true");
    $("context_protectTab").setAttribute("disabled", disableProtect);
    $("context_lockTab").setAttribute("disabled", disableLock);
    $("context_freezeTab").setAttribute("disabled", disableProtect || disableLock);

    var disableLeft = gBrowser.leftTabsOf(gBrowser.mContextTabs).length == 0;
    var disableRight = gBrowser.rightTabsOf(gBrowser.mContextTabs).length == 0;
    var disableOther = gBrowser.otherTabsOf(gBrowser.mContextTabs).length == 0;

    $("context_closeLeftTabs").setAttribute("disabled", disableLeft);
    $("context_closeRightTabs").setAttribute("disabled", disableRight);
    $("context_closeOtherTabs").setAttribute("disabled", disableOther);
    $("context_closeDuplicateTabs").setAttribute("disabled", disableOther);
    $("context_closeSimilarTabs").setAttribute("disabled", disableOther);

    var selectedTabs = gBrowser.selectedTabs;
    $("context_groupTab").setAttribute("disabled", selectedTabs.length <= 1);
    $("context_selectTab").setAttribute("checked", mselected);
    $("context_unselectAllTabs").setAttribute("disabled", selectedTabs.length == 0);

    $("context_openTabInWindow").collapsed = !$("context_moveToWindow").collapsed;
    $("context_mergeWindow").setAttribute("disabled", Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getZOrderDOMWindowEnumerator("navigator:browser", false).getNext() == window);

    $("context_mergeGroup").hidden = $("context_tabViewMenu").hidden;
    $("context_mergeGroup").setAttribute("disabled", !Array.some(gBrowser.mTabs, function(aTab) aTab.hidden));
    $("context_pinTab").collapsed = $("context_unpinTab").collapsed = !$("context_pegTab").collapsed;
  }, false);

  tabutils.populateWindowMenu = function populateWindowMenu(aPopup, aExcludePopup) {
    while (aPopup.lastChild && aPopup.lastChild.localName != "menuseparator")
      aPopup.removeChild(aPopup.lastChild);

    var winEnum = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getEnumerator("navigator:browser");
    while (winEnum.hasMoreElements()) {
      var win = winEnum.getNext();
      var m = document.createElement("menuitem");
      m.setAttribute("class", "menuitem-iconic bookmark-item menuitem-with-favicon");
      m.setAttribute("label", win.gBrowser.mCurrentTab.label);
      m.setAttribute("image", win.gBrowser.mCurrentTab.image);
      m.setAttribute("acceltext", "[" + win.gBrowser.mTabs.length + "]");
      m.setAttribute("disabled", win == window || aExcludePopup && !win.toolbar.visible);
      m.window = win;
      aPopup.appendChild(m);
    }
  };

  TabView.populateGroupMenu = function(aPopup, aExcludeEmpty) {
    while (aPopup.lastChild && aPopup.lastChild.localName != "menuseparator")
      aPopup.removeChild(aPopup.lastChild);

    if (!this._window && !Array.some(gBrowser.mTabs, function(aTab) aTab.hidden))
      return;

    let self = this;
    this._initFrame(function() {
      let activeGroupItem = self._window.GroupItems.getActiveGroupItem();
      self._window.GroupItems.groupItems.forEach(function(groupItem) {
        if (!groupItem.hidden && (groupItem.getChildren().length > 0 || !aExcludeEmpty && groupItem.getTitle().length > 0)) {
          let activeTab = groupItem.getActiveTab() || groupItem.getChild(0);
          let m = document.createElement("menuitem");
          m.setAttribute("class", "menuitem-iconic bookmark-item menuitem-with-favicon");
          m.setAttribute("label", activeTab && activeTab.tab.label);
          m.setAttribute("image", activeTab && activeTab.tab.image);
          m.setAttribute("acceltext", groupItem.getTitle() + "[" + groupItem.getChildren().length + "]");
          m.setAttribute("disabled", groupItem == activeGroupItem);
          m.value = groupItem;
          aPopup.appendChild(m);
        }
      });
    });
  };

  TabView.moveTabsTo = function(aTabs, aGroupItem) {
    if (!aGroupItem.isAGroupItem) {
      TabView.moveTabTo(aGroupItem.tab, null);
      aGroupItem = aGroupItem.parent;
    }
    aTabs.forEach(function(aTab) TabView.moveTabTo(aTab, aGroupItem.id));
    gBrowser.updateCurrentBrowser(true);
  };

  TabView.mergeGroup = function(aGroupItem) {
    if (aGroupItem.isAGroupItem) {
      this._window.GroupItems.newTab({});

      let activeGroupItem = this._window.GroupItems.getActiveGroupItem();
      if (activeGroupItem != aGroupItem)
        aGroupItem.getChildren().slice().forEach(function(tabItem) TabView.moveTabTo(tabItem.tab, activeGroupItem.id));
    }
    else {
      this._window.GroupItems.newTab(aGroupItem);
    }
    gBrowser.updateCurrentBrowser(true);
  };

  TabView.selectGroup = function(aGroupItem) {
    if (!aGroupItem)
      return;

    if (aGroupItem.isAGroupItem) {
      let activeTab = aGroupItem.getActiveTab() || aGroupItem.getChild(0);
      if (activeTab)
        gBrowser.selectedTab = activeTab.tab;
    }
    else
      gBrowser.selectedTab = aGroupItem.tab;
  };

  var button = $("nav-bar")._getToolbarItem("tabview-button");
  if (button && !button.hasChildNodes()) {
    let popup = button.appendChild(document.createElement("menupopup"));
    popup.setAttribute("onpopupshowing", "TabView.populateGroupMenu(event.target, true);");
    popup.setAttribute("oncommand", "TabView.selectGroup(event.originalTarget.value);");
    popup.setAttribute("position", "after_end");
    button.setAttribute("type", "menu-button");

    let item = popup.appendChild(document.createElement("menuitem"));
    item.setAttribute("label", $("context_tabViewNewGroup").getAttribute("label"));
    item.setAttribute("command", "cmd_newGroup");
    popup.appendChild(document.createElement("menuseparator"));
  }
};

//�г����б�ǩҳ�����˵�
tabutils._allTabsPopup = function() {
  function $() {return document.getElementById.apply(document, arguments);}

  var allTabsPopup = gBrowser.mTabContainer.mAllTabsPopup;
  if (!allTabsPopup)
    return;

  Array.slice($("alltabs-popup-template").childNodes).forEach(function(aItem) {
    allTabsPopup.appendChild(aItem);
  });

  allTabsPopup.setAttribute("oncommand", "event.stopPropagation();");
  allTabsPopup.setAttribute("onclick", "if (event.button == 0) event.stopPropagation();");
  tabutils.addEventListener(allTabsPopup.parentNode, "popupshowing", function(event) {
    while (allTabsPopup.firstChild && allTabsPopup.firstChild.tab) //Bug 714594 (Fx12), 716271 (Fx12)
      allTabsPopup.removeChild(allTabsPopup.firstChild);

    var lastVisibleItem = null;
    for (let item = allTabsPopup.firstChild; item && !item.tab; item = item.nextSibling) {
      if (item.localName == "menuseparator")
        item.hidden = !lastVisibleItem || lastVisibleItem.localName == "menuseparator";

      if (!item.hidden && !item.collapsed)
        lastVisibleItem = item;
    }

    var item = $("context_showAllTabs");
    item.setAttribute("checked", gBrowser.mTabContainer.getAttribute("showAllTabs"));
    item.setAttribute("disabled", gBrowser.mTabContainer.orient == "vertical");

    var tabs = gBrowser.allTabs;
    var item = $("context_readAllTabs");
    var checked = tabs.every(function(aTab) aTab.getAttribute("unread") != "true");
    item.setAttribute("label", checked ? item.getAttribute("label_checked") : item.getAttribute("label_unchecked"));
    item.setAttribute("checked", checked);
    item.setAttribute("disabled", tabs.every(function(aTab) aTab.selected));

    [
      ["context_protectAllTabs", ["protected"]],
      ["context_lockAllTabs", ["locked"]],
      ["context_freezeAllTabs", ["protected", "locked"]],
      ["context_faviconizeAllTabs", ["faviconized"]],
      ["context_pegAllTabs", ["pinned"]],
      ["context_hideAllTabs", ["concealed"]]
    ].forEach(function([aId, aAttrs]) {
      $(aId).setAttribute("checked", tabs.every(function(aTab) aAttrs.every(function(aAttr) aTab.hasAttribute(aAttr))));
    });
  }, true);

  if ("MenuEdit" in window) { //Make allTabsPopup editable by MenuEdit
    TU_hookCode("MenuEdit.getEditableMenus", /(?=return menus;)/, "menus['" + allTabsPopup.id + "'] = gBrowser.mTabContainer.mAllTabsPopup.parentNode.tooltipText;");
  }
};

tabutils._hideTabBar = function() {
  if (onViewToolbarsPopupShowing.name == "onViewToolbarsPopupShowing") //Compa. with Omnibar
  TU_hookCode("onViewToolbarsPopupShowing", /(?=.*addon-bar.*)/, function() {
    let tabsToolbar = document.getElementById("TabsToolbar");
    if (toolbarNodes.indexOf(tabsToolbar) == -1)
      toolbarNodes.push(tabsToolbar);
  });

  TU_hookCode("setToolbarVisibility", /.*setAttribute.*/, 'if (toolbar.id == "TabsToolbar") gBrowser.mTabContainer.visible = isVisible; else $&');
  TU_hookCode("gBrowser.mTabContainer.updateVisibility", "{", 'if (!TU_getPref("browser.tabs.autoHide")) return;');
};

//�����رձ�ǩҳ��ť
tabutils._undoCloseTabButton = function() {
  TU_hookCode("HistoryMenu.prototype._undoCloseMiddleClick",
    ["{", function() {
      if (aEvent.button == 2) {
        tabutils._ss.forgetClosedTab(window, Array.indexOf(aEvent.originalTarget.parentNode.childNodes, aEvent.originalTarget));
        aEvent.originalTarget.parentNode.removeChild(aEvent.originalTarget);
        tabutils.updateUndoCloseTabCommand();
        aEvent.preventDefault();
        return;
      }
    }],
    ["aEvent.originalTarget.value", "Array.indexOf(aEvent.originalTarget.parentNode.childNodes, aEvent.originalTarget)"],
    [/.*undoCloseTab.*/, "$&;aEvent.originalTarget.parentNode.removeChild(aEvent.originalTarget);"]
  );

  TU_hookCode("HistoryMenu.prototype.populateUndoSubmenu",
    ['" + i + "', "Array.indexOf(this.parentNode.childNodes, this)"],
    ["}", function() {
      var sanitizeItem = document.getElementById("sanitizeItem");
      m = undoPopup.appendChild(document.createElement("menuitem"));
      m.setAttribute("label", sanitizeItem.getAttribute("label").replace("\u2026", ""));
      m.setAttribute("accesskey", sanitizeItem.getAttribute("accesskey"));
      m.addEventListener("command", function() {
        for (let i = 0; i < undoItems.length; i++)
          tabutils._ss.forgetClosedTab(window, 0);
        tabutils.updateUndoCloseTabCommand();
      }, false);
      undoPopup.setAttribute("onclick", "if (tabutils._ss.getClosedTabCount(window) == 0) closeMenus(this);event.stopPropagation();");
      undoPopup.setAttribute("oncommand", "event.stopPropagation();");
      undoPopup.setAttribute("context", "");
    }],
    ["}", function() {
      if (!undoPopup.hasStatusListener) {
        undoPopup.addEventListener("DOMMenuItemActive", function(event) {XULBrowserWindow.setOverLink(event.target.getAttribute("targetURI"));}, false);
        undoPopup.addEventListener("DOMMenuItemInactive", function() {XULBrowserWindow.setOverLink("");}, false);
        undoPopup.hasStatusListener = true;
      }
    }]
  );

  tabutils._undoCloseMiddleClick = HistoryMenu.prototype._undoCloseMiddleClick;
  tabutils.populateUndoSubmenu = HistoryMenu.prototype.populateUndoSubmenu;
  TU_hookCode("tabutils.populateUndoSubmenu",
    [/var undoPopup.*/, "var undoPopup = arguments[0];"],
    [/.*undoMenu.*/g, ""],
    ["return;", "return false;"],
    ["}", "return true;"]
  );

  tabutils.updateUndoCloseTabCommand = function updateUndoCloseTabCommand() {
    document.getElementById("History:UndoCloseTab").setAttribute("disabled", tabutils._ss.getClosedTabCount(window) == 0);
    gBrowser._lastClosedTabsCount = null;
  };
  tabutils.updateUndoCloseTabCommand();
  TU_hookCode("gBrowser.onTabClose", "}", "tabutils.updateUndoCloseTabCommand();");
  TU_hookCode("gBrowser.onTabRestoring", "}", "tabutils.updateUndoCloseTabCommand();");
  TU_hookCode("gSessionHistoryObserver.observe", "}", "tabutils.updateUndoCloseTabCommand();");
  TU_hookCode("TabContextMenu.updateContextMenu", 'document.getElementById("context_undoCloseTab").disabled =', "");
};

tabutils._firstRun = function() {
  if (TU_getPref("extensions.tabutils.firstRun"))
    return;
  TU_setPref("extensions.tabutils.firstRun", true);

  let navbar = document.getElementById("nav-bar");
  navbar.currentSet = navbar.currentSet.replace(/undoclosetab-button|button_tuOptions/g, "")
                                       .replace("urlbar-container", "undoclosetab-button,button_tuOptions,$&");
  navbar.setAttribute("currentset", navbar.currentSet);
  document.persist(navbar.id, "currentset");
};

tabutils._tabPrefObserver = {
  init: function() {
    window.addEventListener("unload", this, false);
    this.register();

    //Close buttons
    TU_hookCode("gBrowser.mTabContainer.adjustTabstrip",
      [/this.firstChild|[\w.]+(?=.getBoundingClientRect)/, <![CDATA[
        ((let (tab) (Array.some(this.childNodes, function(aTab) {
          return aTab.boxObject.width > 0 && !aTab.hasAttribute("pinned") && !aTab.hasAttribute("faviconized") && (tab = aTab);
        }), tab)) || $&)
      ]]>],
      ["this.mCloseButtons", "($& & 0x0f)"],
      ["this.mCloseButtons != 3", "(this.mCloseButtons & 0x0f) != 3 && !(this.mCloseButtons & 0x20)"],
      ["this._closeWindowWithLastTab", "false", "g"],
      ["}", function() {
        this.setAttribute("closeButtonOnPointedTab", (this.mCloseButtons & 0x0f) == 1 || !!(this.mCloseButtons & 0x10));
      }]
    );

    //Tab counter
    TU_hookCode("gBrowser.mTabContainer.adjustTabstrip", "}", function() {
      if (this.mAllTabsPopup) {
        let n = gBrowser.mTabs.length - gBrowser._removingTabs.length;
        let m = gBrowser.allTabs.length;
        this.mAllTabsPopup.parentNode.label = m == n ? n : [m, n].join("/");
      }
    });

    //Tab animations
    TU_hookCode("gBrowser.addTab", '!Services.prefs.getBoolPref("browser.tabs.animate")', 'this.mTabContainer.orient == "vertical" || $&');
    TU_hookCode("gBrowser.removeTab", '!Services.prefs.getBoolPref("browser.tabs.animate")', 'this.mTabContainer.orient == "vertical" || $&');
    TU_hookCode("gBrowser.removeTab", 'window.getComputedStyle(aTab).maxWidth == "0.1px"', 'aTab.boxObject.width == 0');

    //Vertical tabs
    TU_hookCode("gBrowser.mTabContainer._notifyBackgroundTab",
      [/(?=var scrollRect)/, function() {
        var vertical = this.orient == "vertical";
        var [start, end, size] = vertical ? ["top", "bottom", "height"]
                                          : ["left", "right", "width"];
      }],
      [".left", "[start]", "g"],
      [".right", "[end]", "g"],
      [".width", "[size]", "g"]
    );

    TU_hookCode("gBrowser.mTabContainer._getDropIndex",
      ["{", function() {
        var vertical = this.orient == "vertical";
        var [position, size] = vertical ? ["screenY", "height"]
                                        : ["screenX", "width"];
      }],
      [/getComputedStyle.*direction == "ltr"/, "$& || vertical"],
      [".screenX", "[position]", "g"],
      [".width", "[size]", "g"]
    );

    //Shortcuts
    tabutils.addEventListener(window, "keypress", function(event) {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.charCode == 90 || event.charCode == 122)) {//Ctrl+Shift+Z
        let popup = document.getElementById('undoCloseTabPopup');
        if (popup.state == "open") {
          popup.hidePopup();
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }, true);

    //Don't allow drag/dblclick on the tab bar to act on the window
    if ("_update" in TabsInTitlebar) // Compat. with Linux
    TU_hookCode("TabsInTitlebar._update", "!this._dragBindingAlive", "$& && TU_getPref('extensions.tabutils.dragBindingAlive', true)");

    gPrefService.getChildList("extensions.tabutils.", {}).sort().concat([
      "browser.tabs.animate", //Bug 649671
      "browser.tabs.tabClipWidth",
      "browser.tabs.tabMaxWidth",
      "browser.tabs.tabMinWidth",
      "browser.tabs.tabMinHeight"
    ]).forEach(function(aPrefName) {
      this.observe(null, "nsPref:changed", aPrefName);
    }, this);
  },

  register: function() {
    var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch2);
    prefs.addObserver("", this, false);
  },

  unregister: function() {
    var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch2);
    prefs.removeObserver("", this);
  },

  get cssRules() {
    delete this.cssRules;
    return this.cssRules = {
      current:   { tab:  tabutils.insertRule('.tabbrowser-tab[selected="true"] {}'),
                   text: tabutils.insertRule('.tabbrowser-tab[selected="true"] * {}')},
      unread:    { tab:  tabutils.insertRule('.tabbrowser-tab[unread="true"]:not([selected="true"]) {}'),
                   text: tabutils.insertRule('.tabbrowser-tab[unread="true"]:not([selected="true"]) * {}')},
      read:      { tab:  tabutils.insertRule('.tabbrowser-tab:not([unread="true"]):not([selected="true"]) {}'),
                   text: tabutils.insertRule('.tabbrowser-tab:not([unread="true"]):not([selected="true"]) * {}')},
      unloaded:  { tab:  tabutils.insertRule(':-moz-any(.tabbrowser-tab, .alltabs-item)[restoring]:not([busy]) {}'),
                   text: tabutils.insertRule(':-moz-any(.tabbrowser-tab, .alltabs-item)[restoring]:not([busy]) * {}')},
      selected:  { tab:  tabutils.insertRule('.tabbrowser-tab[multiselected] {}'),
                   text: tabutils.insertRule('.tabbrowser-tab[multiselected] * {}')},
      protected: { tab:  tabutils.insertRule('.tabbrowser-tab[protected] {}'),
                   text: tabutils.insertRule('.tabbrowser-tab[protected] * {}')},
      locked:    { tab:  tabutils.insertRule('.tabbrowser-tab[locked] {}'),
                   text: tabutils.insertRule('.tabbrowser-tab[locked] * {}')}
    };
  },

  batching: false,
  observe: function(aSubject, aTopic, aData) {
    if (aTopic != "nsPref:changed" || this.batching)
      return;

    switch (aData) {
      case "browser.tabs.animate": this.animate();return;
      case "browser.tabs.tabClipWidth": this.tabClipWidth();return;
      case "browser.tabs.tabMaxWidth": this.tabMaxWidth();return;
      case "browser.tabs.tabMinWidth": this.tabMinWidth();return;
      case "browser.tabs.tabMinHeight": this.tabMinHeight();return;
    }

    if (!aData.startsWith("extensions.tabutils."))
      return;

    let name = aData.slice(20).replace(".", "_", "g");
    if (name in this) {
      this[name]();
      return;
    }

    //Tab stack coloring
    if (/^extensions.tabutils.colorStack.([0-9A-Fa-f]+)$/.test(aData)) {
      this.updateGroupColor(RegExp.$1, TU_getPref(aData));
      return;
    }

    //Tab highlighting
    if (/^extensions.tabutils.(?:highlight|styles.)([^.]+)$/.test(aData)) {
      let prefName = RegExp.$1.toLowerCase();
      let style = {};
      try {
        style = JSON.parse(TU_getPref("extensions.tabutils.styles." + prefName));
        if (!TU_getPref("extensions.tabutils.highlight" + prefName[0].toUpperCase() + prefName.slice(1)))
          style.bold = style.italic = style.underline = style.strikethrough = style.outline = style.color = style.bgColor = style.opacity = false;
      }
      catch (e) {}

      if (!(prefName in this.cssRules))
        return;

      let tabStyle = this.cssRules[prefName].tab.style;
      tabStyle.setProperty("font-weight", style.bold ? "bold" : "", "");
      tabStyle.setProperty("font-style", style.italic ? "italic" : "", "");
      tabStyle.setProperty("text-decoration", style.underline ? "underline" : style.strikethrough ? "line-through" : "", "");
      tabStyle.setProperty("outline", style.outline ? "1px solid" : "", "");
      tabStyle.setProperty("outline-offset", style.outline ? "-1px" : "", "");
      tabStyle.setProperty("outline-color", style.outline ? style.outlineColorCode : "", "");
      tabStyle.setProperty("-moz-outline-radius", style.outline ? "4px" : "", "");
      tabStyle.setProperty("color", style.color ? style.colorCode : "", "important");
      tabStyle.setProperty("background-image", style.bgColor ? "-moz-linear-gradient(" + style.bgColorCode + "," + style.bgColorCode + ")" : "", "important");
      tabStyle.setProperty("opacity", style.opacity ? style.opacityCode : "", "");

      let textStyle = this.cssRules[prefName].text.style;
      textStyle.setProperty("color", style.color ? style.colorCode : "", "important");
      textStyle.setProperty("background-image", style.bgColor ? "-moz-linear-gradient(" + style.bgColorCode + "," + style.bgColorCode + ")" : "", "important");
      return;
    }

    //Custom context menuitems
    if (/^extensions.tabutils.menu.([^.]+)$/.test(aData)) {
      let item = document.getElementById(RegExp.$1);
      if (item)
        item.collapsed = !TU_getPref(aData);
      return;
    }

    if (/^extensions.tabutils.menu.([^.]+).([^.]+)$/.test(aData)) {
      let item = document.getElementById(RegExp.$1);
      if (!item) {
        item = document.createElement("menuitem");
        item.id = RegExp.$1;
        item.collapsed = !TU_getPref("extensions.tabutils.menu." + RegExp.$1);

        if (item.id.toLowerCase().indexOf("alltabs") > -1 && gBrowser.mTabContainer.mAllTabsPopup)
          gBrowser.mTabContainer.mAllTabsPopup.insertBefore(item, document.getElementById("sep_closeAllTabs"));
        else
          gBrowser.tabContextMenu.insertBefore(item, document.getElementById("sep_closeTab"));
      }
      this.setAttribute(item, RegExp.$2, TU_getPref(aData));
      return;
    }

    //Custom shortcut keys
    if (/^extensions.tabutils.shortcut.([^.]+)$/.test(aData)) {
      let key = document.getElementById(RegExp.$1);
      if (key)
        key.setAttribute("disabled", !TU_getPref(aData));
      return;
    }

    if (/^extensions.tabutils.shortcut.([^.]+).([^.]+)$/.test(aData)) {
      let key = document.getElementById(RegExp.$1);
      if (!key) {
        key = document.getElementById("tuKeyset").appendChild(document.createElement("key"));
        key.id = RegExp.$1;
        key.setAttribute("disabled", !TU_getPref("extensions.tabutils.shortcut." + RegExp.$1));
      }
      this.setAttribute(key, RegExp.$2, TU_getPref(aData));
      return;
    }

    //Custom toolbar buttons
    if (/^extensions.tabutils.button.([^.]+)$/.test(aData)) {
      let button = document.getElementById(RegExp.$1);
      if (button)
        button.collapsed = !TU_getPref(aData);
      return;
    }

    if (/^extensions.tabutils.button.(newtab-button|alltabs-button|tabs-closebutton).([^.]+)$/.test(aData)) {
      [
        gBrowser.mTabContainer.mTabstrip.querySelector(".tabs-" + RegExp.$1),
        document.getAnonymousElementByAttribute(gBrowser.mTabContainer, "anonid", RegExp.$1),
        document.getElementById(RegExp.$1 == "newtab-button" ? "new-tab-button" : RegExp.$1)
      ].forEach(function(button) {
        if (button)
          this.setAttribute(button, RegExp.$2, TU_getPref(aData));
      }, this);
      return;
    }

    if (/^extensions.tabutils.button.([^.]+).([^.]+)$/.test(aData)) {
      let button = document.getElementById(RegExp.$1) || gNavToolbox.palette.getElementsByAttribute("id", RegExp.$1)[0];
      if (!button) {
        button = document.getElementById("nav-bar").appendChild(document.createElement("toolbarbutton"));
        button.id = RegExp.$1;
        button.image = gBrowser.mFaviconService.defaultFavicon.spec;
        button.className = "toolbarbutton-1 chromeclass-toolbar-additional";
        button.collapsed = !TU_getPref("extensions.tabutils.button." + RegExp.$1);
      }
      this.setAttribute(button, RegExp.$2, TU_getPref(aData));
      return;
    }

    //Inject CSS code
    if (/^extensions.tabutils.css.[^.]+$/.test(aData)) {
      try {
        tabutils.insertRule(TU_getPref(aData));
      }
      catch (e) {}
      return;
    }

    //Inject JS code
    if (/^extensions.tabutils.js.[^.]+$/.test(aData)) {
      try {
        new Function(TU_getPref(aData))();
      }
      catch (e) {}
      return;
    }
  },

  setAttribute: function(aElt, aAttr, aVal) {
    aVal == null ? aElt.removeAttribute(aAttr) : aElt.setAttribute(aAttr, aVal);
    if (aAttr == "insertbefore" || aAttr == "insertafter" || aAttr == "parent") {
      let parentNode = document.getElementById(aElt.getAttribute("parent")) || aElt.parentNode;
      let refNode;
      switch (true) {
        case aElt.getAttribute("insertafter") != "":
          refNode = parentNode.getElementsByAttribute("id", aElt.getAttribute("insertafter"))[0];
          refNode = refNode && refNode.nextSibling;
          break;
        case aElt.getAttribute("insertbefore") != "":
          refNode = parentNode.getElementsByAttribute("id", aElt.getAttribute("insertbefore"))[0];
          break;
      }
      parentNode.insertBefore(aElt, refNode);
    }
    else if (aAttr == "separatorbefore" || aAttr == "separatorafter") {
      let refNode = aAttr == "separatorbefore" ? aElt : aElt.nextSibling;
      if (aElt.localName == "menuitem" || aElt.localName == "menu")
        aElt.parentNode.insertBefore(document.createElement("menuseparator"), refNode);
      else if (aElt.localName == "toolbarbutton" || aElt.localName == "toolbaritem")
        aElt.parentNode.insertBefore(document.createElement("toolbarseparator"), refNode);
    }
  },

  animate: function() {
    gBrowser.mTabContainer.setAttribute("dontanimate", !TU_getPref("browser.tabs.animate"));
  },

  tabClipWidth: function() {
    gBrowser.mTabContainer.mTabClipWidth = TU_getPref("browser.tabs.tabClipWidth");
    gBrowser.mTabContainer.adjustTabstrip();
  },

  tabMaxWidth: function() {
    this._tabWidthRule[0].style.setProperty("max-width", TU_getPref("browser.tabs.tabMaxWidth") + "px", "");
    this._tabWidthRule[1].style.setProperty("width", TU_getPref("browser.tabs.tabMaxWidth") + "px", "");
    gBrowser.mTabContainer.adjustTabstrip();
  },

  tabMinWidth: function() {
    this._tabWidthRule[0].style.setProperty("min-width", TU_getPref("browser.tabs.tabMinWidth") + "px", "");
    gBrowser.mTabContainer.adjustTabstrip();
  },

  tabFitTitle: function() {
    gBrowser.mTabContainer.setAttribute("tabfittitle", TU_getPref("extensions.tabutils.tabFitTitle"));
  },

  tabMinHeight: function() {
    this._tabHeightRule[0].style.setProperty("min-height", TU_getPref("browser.tabs.tabMinHeight") + "px", "important");
    this.tabstripHeight();
  },

  tabstripHeight: function() {
    var tab = gBrowser.mTabContainer.lastChild;
    while (tab && tab.boxObject.height == 0)
      tab = tab.previousSibling;
    if (!tab)
      return;

    var wasSelected = tab.selected;
    var wasPinned = tab.hasAttribute("pinned");

    tab.removeAttribute("selected");
    tab.removeAttribute("pinned");
    this._tabHeightRule[1].style.minHeight = "";

    var style = getComputedStyle(tab, null);
    var height = tab.boxObject.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    this._tabHeightRule[1].style.minHeight = height + "px";

    wasSelected ? tab.setAttribute("selected", true) : tab.removeAttribute("selected");
    wasPinned ? tab.setAttribute("pinned", true) : tab.removeAttribute("pinned");
  },

  get _tabWidthRule() {
    delete this._tabWidthRule;
    return this._tabWidthRule = [
      tabutils.insertRule('.tabbrowser-tab:not([faviconized]) {width: 0; -moz-box-flex: 100;}'),
      tabutils.insertRule('.tabbrowser-arrowscrollbox[orient="vertical"] > scrollbox {}'),
      tabutils.insertRule('#tabbrowser-tabs[orient="vertical"] > .tabbrowser-tab {max-width: none !important; -moz-box-flex: 0;}')
    ];
  },

  get _tabHeightRule() {
    delete this._tabHeightRule;
    return this._tabHeightRule = [
      tabutils.insertRule('.tabbrowser-tab, .tabbrowser-arrowscrollbox > .tabs-newtab-button {}'),
      tabutils.insertRule('.tabbrowser-tabs:not([multirow]) .tabbrowser-arrowscrollbox > scrollbox {}')
    ];
  },

  tabBarPosition: function() {
    var tabsToolbar = document.getElementById("TabsToolbar");
    var addonBar = document.getElementById("addon-bar");
    var appcontent = document.getElementById("appcontent");
    var allTabsPopup = gBrowser.mTabContainer.mAllTabsPopup;

    switch (TU_getPref("extensions.tabutils.tabBarPosition")) {
      case 1: //Bottom
        if (tabsToolbar && tabsToolbar.nextSibling != addonBar) { //Fx 4.0
          gBrowser.mTabContainer.mTabstrip._stopSmoothScroll();
          addonBar.parentNode.insertBefore(tabsToolbar, addonBar);
          tabsToolbar.orient = gBrowser.mTabContainer.orient = gBrowser.mTabContainer.mTabstrip.orient = "horizontal";
          TabsInTitlebar.allowedBy("tabbarposition", false);
        }
        if (allTabsPopup && allTabsPopup.parentNode.hasAttribute("type")) { //Bug 620081
          allTabsPopup.parentNode.removeAttribute("type");
          allTabsPopup.parentNode.setAttribute("popup", "_child");
        }
        break;
      case 2: //Left
        if (tabsToolbar && tabsToolbar.nextSibling != appcontent) {
          gBrowser.mTabContainer.mTabstrip._stopSmoothScroll();
          appcontent.parentNode.insertBefore(tabsToolbar, appcontent);
          tabsToolbar.orient = gBrowser.mTabContainer.orient = gBrowser.mTabContainer.mTabstrip.orient = "vertical";
          TabsInTitlebar.allowedBy("tabbarposition", false);
          gBrowser.mTabContainer.removeAttribute("overflow");
        }
        break;
      case 3: //Right
        if (tabsToolbar && tabsToolbar.previousSibling != appcontent) {
          gBrowser.mTabContainer.mTabstrip._stopSmoothScroll();
          appcontent.parentNode.insertBefore(tabsToolbar, appcontent.nextSibling);
          tabsToolbar.orient = gBrowser.mTabContainer.orient = gBrowser.mTabContainer.mTabstrip.orient = "vertical";
          TabsInTitlebar.allowedBy("tabbarposition", false);
          gBrowser.mTabContainer.removeAttribute("overflow");
        }
        break;
      case 0: //Top
      default:
        if (tabsToolbar && tabsToolbar.parentNode != gNavToolbox) { //Fx 4.0
          gBrowser.mTabContainer.mTabstrip._stopSmoothScroll();
          gNavToolbox.appendChild(tabsToolbar);
          tabsToolbar.orient = gBrowser.mTabContainer.orient = gBrowser.mTabContainer.mTabstrip.orient = "horizontal";
          TabsInTitlebar.allowedBy("tabbarposition", true);
        }
        if (allTabsPopup && allTabsPopup.parentNode.hasAttribute("popup")) {
          allTabsPopup.parentNode.removeAttribute("popup");
          allTabsPopup.parentNode.setAttribute("type", "menu");
        }
        break;
    }

    this.closeButtons();
  },

  closeButtons: function() {
    gBrowser.mTabContainer.mCloseButtons = TU_getPref("extensions.tabutils.closeButtons");
    gBrowser.mTabContainer.adjustTabstrip();
  },

  showTabCounter: function() {
    var allTabsPopup = gBrowser.mTabContainer.mAllTabsPopup;
    if (allTabsPopup)
      allTabsPopup.parentNode.setAttribute("showTabCounter", TU_getPref("extensions.tabutils.showTabCounter"));

    gBrowser.mTabContainer.adjustTabstrip();
    this.tabstripHeight();
  },

  showLeftSpace: function() {
    gBrowser.mTabContainer.setAttribute("showLeftSpace", TU_getPref("extensions.tabutils.showLeftSpace"));
    gBrowser.mTabContainer.adjustTabstrip();
  },

  showRightSpace: function() {
    gBrowser.mTabContainer.setAttribute("showRightSpace", TU_getPref("extensions.tabutils.showRightSpace"));
    gBrowser.mTabContainer.adjustTabstrip();
  },

  showAllTabs: function() {
    let showAllTabs = TU_getPref("extensions.tabutils.showAllTabs");
    if (showAllTabs) {
      gBrowser.mTabContainer.setAttribute("showAllTabs", true);
      gBrowser.mTabContainer.enterBlockMode();
    }
    else {
      gBrowser.mTabContainer.removeAttribute("showAllTabs");
      gBrowser.mTabContainer.exitBlockMode();
    }
  },

  statusbarMode: function() {
    switch (TU_getPref("extensions.tabutils.statusbarMode")) {
      case 0: document.getElementById("status-bar").setAttribute("mode", "icons");break;
      case 1: document.getElementById("status-bar").setAttribute("mode", "text");break;
      default: document.getElementById("status-bar").setAttribute("mode", "full");break;
    }
  },

  hideOpenInTab: function() {
    var hideOpenInTab = TU_getPref("extensions.tabutils.hideOpenInTab");
    document.getElementById("statusbar-openintab").collapsed = hideOpenInTab;
  },

  hideLoadInBackground: function() {
    var hideLoadInBackground = TU_getPref("extensions.tabutils.hideLoadInBackground");
    if (hideLoadInBackground)
      TU_setPref("extensions.tabutils.loadAllInBackground", false);
    document.getElementById("statusbar-loadinbackground").collapsed = hideLoadInBackground;
  },

  hideLoadInForeground: function() {
    var hideLoadInForeground = TU_getPref("extensions.tabutils.hideLoadInForeground");
    if (hideLoadInForeground)
      TU_setPref("extensions.tabutils.loadAllInForeground", false);
    document.getElementById("statusbar-loadinforeground").collapsed = hideLoadInForeground;
  },

  openLinkInTab: function() {
    tabutils.gOpenLinkInTab = TU_getPref("extensions.tabutils.openLinkInTab");
    document.getElementById("statusbar-openintab").setAttribute("checked", tabutils.gOpenLinkInTab);
  },

  loadAllInBackground: function() {
    tabutils.gLoadAllInBackground = TU_getPref("extensions.tabutils.loadAllInBackground");
    if (tabutils.gLoadAllInBackground)
      TU_setPref("extensions.tabutils.loadAllInForeground", false);
    document.getElementById("statusbar-loadinbackground").setAttribute("checked", tabutils.gLoadAllInBackground);
  },

  loadAllInForeground: function() {
    tabutils.gLoadAllInForeground = TU_getPref("extensions.tabutils.loadAllInForeground");
    if (tabutils.gLoadAllInForeground)
      TU_setPref("extensions.tabutils.loadAllInBackground", false);
    document.getElementById("statusbar-loadinforeground").setAttribute("checked", tabutils.gLoadAllInForeground);
  },

  loadInNewTab: function() {
    switch (TU_getPref("extensions.tabutils.loadInNewTab")) {
      case 0: Services.prefs.clearUserPref("browser.newtab.url");break;
      case 1: TU_setPref("browser.newtab.url", gHomeButton.getHomePage().split("|")[0]);break;
    }
  },

  dragBindingAlive: function() {
    let tabsToolbar = document.getElementById("TabsToolbar");
    if (tabsToolbar && tabsToolbar._dragBindingAlive != null)
      tabsToolbar._dragBindingAlive = TU_getPref("extensions.tabutils.dragBindingAlive", true);
  },

  pinTab_showPhantom: function() {
    gBrowser.updatePinnedTabsBar();
    gBrowser.mTabContainer.setAttribute("showPhantom", TU_getPref("extensions.tabutils.pinTab.showPhantom"));
    gBrowser.mTabContainer.positionPinnedTabs();
    gBrowser.mTabContainer.adjustTabstrip();
  },

  colorStack: function() {
    gBrowser.mTabContainer.setAttribute("colorStack", TU_getPref("extensions.tabutils.colorStack"));
  },

  toolbarShadowOnTab: "-moz-linear-gradient(bottom, rgba(10%,10%,10%,.4) 1px, transparent 1px)",
  bgTabTexture: "-moz-linear-gradient(transparent, hsla(0,0%,45%,.1) 1px, hsla(0,0%,32%,.2) 80%, hsla(0,0%,0%,.2))",
  bgTabTextureHover: "-moz-linear-gradient(hsla(0,0%,100%,.3) 1px, hsla(0,0%,75%,.2) 80%, hsla(0,0%,60%,.2))",
  selectedTabTexture: "-moz-linear-gradient(rgba(255,255,255,0), rgba(255,255,255,.5) 50%)",

  _tabColoringRules: {},
  updateGroupColor: function(group, color) {
    if (color && !(group in this._tabColoringRules)) {
      let selectorText;
      if (group[0] == "{")
        selectorText = '#main-window .tabbrowser-tab[group="' + group + '"]:not([group-counter="1"])';
      else
        selectorText = '.tabbrowser-tabs[colorStack="true"] > .tabbrowser-tab[group^="{' + group + '"]:not([group-counter="1"])';

      this._tabColoringRules[group] = [
        tabutils.insertRule(selectorText + '{}'),
        tabutils.insertRule(selectorText + ':hover {}'),
        tabutils.insertRule(selectorText + '[selected="true"] {}'),
        tabutils.insertRule('#main-window[tabsontop=false]:not([disablechrome]) ' + selectorText.replace('#main-window', '#tabbrowser-tabs >') + '[selected="true"]:not(:-moz-lwtheme) {}')
      ];
    }

    if (group in this._tabColoringRules) {
      let gradient = '-moz-linear-gradient(' + color + ', -moz-dialog)';
      this._tabColoringRules[group][0].style.backgroundImage = color ? [this.toolbarShadowOnTab, this.bgTabTexture, gradient].join() : "";
      this._tabColoringRules[group][1].style.backgroundImage = color ? [this.toolbarShadowOnTab, this.bgTabTextureHover, gradient].join() : "";
      this._tabColoringRules[group][2].style.backgroundImage = color ? [this.selectedTabTexture, gradient].join() : "";
      this._tabColoringRules[group][3].style.backgroundImage = color ? [this.toolbarShadowOnTab, this.selectedTabTexture, gradient].join() : "";
    }
  },

  handleEvent: function(event) {
    switch (event.type) {
      case "load":
        window.removeEventListener("load", this, false);
        this.init();
        break;
      case "unload":
        window.removeEventListener("unload", this, false);
        this.unregister();
        break;
    }
  }
};

tabutils._tagsFolderObserver = {
  _tags: ["protected", "locked", "faviconized", "pinned", "concealed", "autoRename", "autoReload", "norestart"],
  _tagIds: [],
  _taggedURIs: [],

  _getIndexForTag: function(aTag) {
    for (let i = 0; i < this._tags.length; i++) {
      if (this._tags[i].toLowerCase() == aTag.toLowerCase())
        return i;
    }
    return -1;
  },

  _updateTaggedURIs: function(aTag, aIndex) {
    if (aIndex == null) {
      aIndex = typeof(aTag) == "string" ? this._getIndexForTag(aTag)
                                        : this._tagIds.indexOf(aTag);
      if (aIndex == -1)
        return;
      aTag = this._tags[aIndex];
    }

    this._tagIds[aIndex] = -1;
    this._taggedURIs[aIndex] = PlacesUtils.tagging.getURIsForTag(aTag);
    this._tagIds[aIndex] = PlacesUtils.getItemIdForTag(aTag);
  },

  init: function() {
    this._tags.forEach(this._updateTaggedURIs, this);
    PlacesUtils.bookmarks.addObserver(this, false);
  },

  uninit: function() {
    PlacesUtils.bookmarks.removeObserver(this);
  },

  getURIsForTag: function(aTag) {
    let index = this._getIndexForTag(aTag);
    return index > -1 && this._tagIds[index] > -1 ? this._taggedURIs[index] : [];
  },

  getTagsForURI: function(aURI) {
    let tags = [];
    this._tags.forEach(function(aTag, aIndex) {
      if (this._tagIds[aIndex] > -1 &&
          this._taggedURIs[aIndex].some(function(bURI) aURI.spec == bURI.spec))
        tags.push(aTag);
    }, this);
    return tags;
  },

  onItemAdded: function(aItemId, aParentId, aIndex, aItemType, aURI, aTitle/* 6.0 */) {
    if (aParentId == PlacesUtils.bookmarks.tagsFolder &&
        aItemType == PlacesUtils.bookmarks.TYPE_FOLDER) {
      if (aTitle == null)
        aTitle = PlacesUtils.bookmarks.getItemTitle(aItemId);
      this._updateTaggedURIs(aTitle);
    }
    else if (aItemType == PlacesUtils.bookmarks.TYPE_BOOKMARK) {
      this._updateTaggedURIs(aParentId);
    }
  },

  onItemRemoved: function(aItemId, aParentId, aIndex, aItemType) {
    if (aParentId == PlacesUtils.bookmarks.tagsFolder &&
        aItemType == PlacesUtils.bookmarks.TYPE_FOLDER) {
      this._updateTaggedURIs(aItemId);
    }
    else if (aItemType == PlacesUtils.bookmarks.TYPE_BOOKMARK) {
      this._updateTaggedURIs(aParentId);
    }
  },

  onItemChanged: function(aItemId, aProperty, aIsAnnotationProperty, aNewValue, aLastModified, aItemType, aParentId/* 6.0 */) {
    if (aParentId == null)
      aParentId = PlacesUtils.bookmarks.getFolderIdForItem(aItemId);

    if (aProperty == "title" &&
        aParentId == PlacesUtils.bookmarks.tagsFolder &&
        aItemType == PlacesUtils.bookmarks.TYPE_FOLDER) {
      this._updateTaggedURIs(aItemId);
      this._updateTaggedURIs(aNewValue);
    }
    else if (aProperty = "uri" && aItemType == PlacesUtils.bookmarks.TYPE_BOOKMARK) {
      this._updateTaggedURIs(aParentId);
    }
  },

  onItemMoved: function(aItemId, aOldParentId, aOldIndex, aNewParentId, aNewIndex, aItemType) {
    if (aItemType == PlacesUtils.bookmarks.TYPE_FOLDER) {
      if (aOldParentId == PlacesUtils.bookmarks.tagsFolder)
        this._updateTaggedURIs(aItemId);
      else if (aNewParentId == PlacesUtils.bookmarks.tagsFolder)
        this._updateTaggedURIs(PlacesUtils.bookmarks.getItemTitle(aItemId));
    }
    else if (aItemType == PlacesUtils.bookmarks.TYPE_BOOKMARK) {
      this._updateTaggedURIs(aOldParentId);
      this._updateTaggedURIs(aNewParentId);
    }
  },

  onBeginUpdateBatch: function() {},
  onEndUpdateBatch: function() {},
  onBeforeItemRemoved: function() {},
  onItemVisited: function() {},
  QueryInterface: XPCOMUtils.generateQI([Ci.nsINavBookmarkObserver])
};
