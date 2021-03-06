TU_hookCode = TU_hookMethod;
function TU_hookMethod(aStr) {
  try {
    var namespaces = aStr.split(".");

    try {
      var object = this;
      while (namespaces.length > 1) {
        object = object[namespaces.shift()];
      }
    }
    catch (e) {
      throw TypeError(aStr + " is not a function");
    }

    var method = namespaces.pop();
    if (typeof object[method] != "function")
      throw TypeError(aStr + " is not a function");

    return object[method] = TU_hookFunc.apply(this, Array.concat(object[method], Array.slice(arguments, 1)));
  }
  catch (e) {
    Components.utils.reportError("Failed to hook " + aStr + ": " + e.message);
  }
}

function TU_hookSetter(aStr) {
  try {
    var namespaces = aStr.split(".");

    try {
      var object = this;
      while (namespaces.length > 1) {
        object = object[namespaces.shift()];
      }
    }
    catch (e) {
      throw TypeError(aStr + " has no setter");
    }

    var property = namespaces.pop();
    var orgSetter = object.__lookupSetter__(property);
    if (!orgSetter)
      throw TypeError(aStr + " has no setter");

    var mySetter = TU_hookFunc.apply(this, Array.concat(orgSetter, Array.slice(arguments, 1)));
    object.__defineGetter__(property, object.__lookupGetter__(property));
    object.__defineSetter__(property, mySetter);

    return mySetter;
  }
  catch (e) {
    Components.utils.reportError("Failed to hook " + aStr + ": " + e.message);
  }
}

function TU_hookFunc(aFunc) {
  var myCode = aFunc.toString();
  for (var i = 1; i < arguments.length;) {
    if (arguments[i].constructor.name == "Array") {
      var [orgCode, newCode, flags] = arguments[i++];
    }
    else {
      var [orgCode, newCode, flags] = [arguments[i++], arguments[i++], arguments[i++]];
    }

    if (typeof newCode == "function" && newCode.length == 0)
      newCode = newCode.toString().replace(/^.*{|}$/g, "");

    switch (orgCode) {
      case "{": [orgCode, newCode] = [/{/, "$&\n" + newCode];break;
      case "}": [orgCode, newCode] = [/}$/, newCode + "\n$&"];break;
    }

    if (typeof orgCode == "string")
      orgCode = RegExp(orgCode.replace(/[{[(\\^|$.?*+/)\]}]/g, "\\$&"), flags || "");

    myCode = myCode.replace(orgCode, newCode);
  }

//  Cu.reportError(myCode);
//  myCode = myCode.replace(/(^.*\n?{)([\s\S]*)(}$)/, function(s, s1, s2, s3) (function() {
//    $1
//    try {
////      switch (arguments.callee.name) {
////        case "set_selectedTab":
////          Cu.reportError(arguments.callee.caller.name + '*' + arguments.callee.name + '*' + (val && val._tPos));break;
////        case "BrowserOpenTab":
////          Cu.reportError(arguments.callee.caller.name + '*' + arguments.callee.name );break;
////      }
//      $2
//    } catch (e) {
//      Cu.reportError([arguments.callee.name ,e]);
//      Cu.reportError(arguments.callee.stack);
//      Cu.reportError(arguments.callee);
//    }
//    $3
//  }).toString().replace(/^.*{|}$/g, "").replace("$1", s1).replace("$2", s2).replace("$3", s3));

  return eval("(" + myCode + ")");
}

if (!("gPrefService" in window)) {
  __defineGetter__("gPrefService", function() {
    delete gPrefService;
    return gPrefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  });
}

function TU_getPref(aPrefName, aDefault) {
  switch (gPrefService.getPrefType(aPrefName)) {
    case gPrefService.PREF_BOOL: return gPrefService.getBoolPref(aPrefName);
    case gPrefService.PREF_INT: return gPrefService.getIntPref(aPrefName);
    case gPrefService.PREF_STRING: return gPrefService.getComplexValue(aPrefName, Components.interfaces.nsISupportsString).data;
    default:
      switch (typeof aDefault) {
        case "boolean": gPrefService.setBoolPref(aPrefName, aDefault);break;
        case "number": gPrefService.setIntPref(aPrefName, aDefault);break;
        case "string": gPrefService.setCharPref(aPrefName, aDefault);break;
      }
      return aDefault;
  }
}

function TU_setPref(aPrefName, aValue) {
  switch (gPrefService.getPrefType(aPrefName)) {
    case gPrefService.PREF_BOOL: return gPrefService.setBoolPref(aPrefName, aValue);
    case gPrefService.PREF_INT: return gPrefService.setIntPref(aPrefName, aValue);
    case gPrefService.PREF_STRING: return gPrefService.setCharPref(aPrefName, aValue);
    default:
      switch (typeof aValue) {
        case "boolean": return gPrefService.setBoolPref(aPrefName, aValue);
        case "number": return gPrefService.setIntPref(aPrefName, aValue);
        case "string": return gPrefService.setCharPref(aPrefName, aValue);
      }
  }
}
