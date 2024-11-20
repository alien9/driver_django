!function() {
    "use strict";
    angular.module("ase.userdata", ["ase.config"])
}(),
function() {
    "use strict";
    function a(a, b, c, d) {
        function e(a) {
            var b = c.defer();
            return k.User.get({
                id: a
            }, function(a) {
                a.isAdmin = h(a),
                b.resolve(a)
            }),
            b.promise
        }
        function f(a, b) {
            i = b;
            var e = c.defer();
            return k.User.queryWithTmpHeader({
                id: a
            }, function(a) {
                a && a.groups && (h(a) || a.groups.indexOf(d.api.groups.readWrite) > -1) ? e.resolve(!0) : e.resolve(!1),
                i = ""
            }),
            e.promise
        }
        function g(b, d) {
            i = d;
            var e = c.defer();
            return k.User.queryWithTmpHeader({
                id: b
            }, function(b) {
                a.debug("user service got user to test:"),
                a.debug(b),
                a.debug("with groups:"),
                a.debug(b.groups),
                h(b) ? (a.debug("have admin in user service"),
                e.resolve(!0)) : e.resolve(!1),
                i = ""
            }),
            e.promise
        }
        function h(a) {
            return a && a.groups && a.groups.indexOf(d.api.groups.admin) > -1 ? !0 : !1
        }
        var i = ""
          , j = b(d.api.hostname + "/api/users/:id/", {
            id: "@id",
            limit: "all"
        }, {
            create: {
                method: "POST",
                url: d.api.hostname + "/api/users/"
            },
            "delete": {
                method: "DELETE",
                url: d.api.hostname + "/api/users/:id/"
            },
            update: {
                method: "PATCH",
                url: d.api.hostname + "/api/users/:id/"
            },
            changePassword: {
                method: "POST",
                url: d.api.hostname + "/api/users/:id/change_password/"
            },
            resetPassword: {
                method: "POST",
                url: d.api.hostname + "/api/users/:id/reset_password/"
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return angular.fromJson(a).results
                },
                isArray: !0
            },
            queryWithTmpHeader: {
                method: "GET",
                headers: {
                    Authorization: function() {
                        return "Token " + i
                    }
                }
            }
        }, {
            cache: !0,
            stripTrailingSlashes: !1
        })
          , k = {
            User: j,
            canWriteRecords: f,
            getUser: e,
            isAdmin: g
        };
        return k
    }
    a.$inject = ["$log", "$resource", "$q", "ASEConfig"],
    angular.module("ase.userdata").factory("UserService", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.interceptors.push("AuthInterceptor"),
        a.interceptors.push("LogoutInterceptor")
    }
    a.$inject = ["$httpProvider"],
    angular.module("ase.auth", ["ase.config", "ase.userdata", "ngCookies"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b) {
        var c = {};
        return c.request = function(c) {
            return c.url.indexOf("api/") > -1 && !c.headers.Authorization && (c.headers.Authorization = "Token " + b.getObject("AuthService.token")),
            c || a.when(c)
        }
        ,
        c
    }
    a.$inject = ["$q", "$cookies"],
    angular.module("ase.auth").factory("AuthInterceptor", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i) {
        function j(a, b) {
            return f(function() {
                d.putObject(n, a, {
                    path: "/"
                }),
                d.putObject(q, b, {
                    path: "/"
                })
            }, 110)
        }
        function k(a) {
            a && (r && (f.cancel(r),
            r = null),
            d.putObject(p, a, {
                path: "/"
            }),
            r = f(function() {
                m.logout()
            }, s))
        }
        function l(a) {
            var b = parseInt(a, 10);
            b = !isNaN(b) && b >= 0 ? b : -1,
            d.putObject(o, b, {
                path: "/"
            })
        }
        var m = {}
          , n = "AuthService.canWrite"
          , o = "AuthService.userId"
          , p = "AuthService.token"
          , q = "AuthService.isAdmin"
          , r = null
          , s = 864e5
          , t = {
            loggedIn: "ASE:Auth:LoggedIn",
            loggedOut: "ASE:Auth:LoggedOut"
        };
        return m.events = t,
        m.isAuthenticated = function() {
            return !!(m.getToken() && m.getUserId() >= 0)
        }
        ,
        m.authenticate = function(d, f) {
            var g = b.defer();
            return c.post(h.api.hostname + "/api-token-auth/", d).success(function(b, c) {
                var d = {
                    status: c,
                    error: ""
                };
                b && b.user && b.token ? (a.debug("sending user service user:"),
                a.debug(b.user),
                a.debug("and token"),
                a.debug(b.token)) : (d.isAuthenticated = !1,
                d.error = "Error obtaining user information.",
                g.resolve(d)),
                i.isAdmin(b.user, b.token).then(function(c) {
                    f ? c ? (l(b.user),
                    k(b.token),
                    d.isAuthenticated = m.isAuthenticated(),
                    d.isAuthenticated ? j(!0, c).then(function() {
                        e.$broadcast(t.loggedIn),
                        g.resolve(d)
                    }) : (d.error = "Unknown error logging in.",
                    g.resolve(d))) : (a.debug("user service sent back:"),
                    a.debug(c),
                    d.isAuthenticated = !1,
                    d.error = "Must be an administrator to access this portion of the site.",
                    g.resolve(d)) : (l(b.user),
                    k(b.token),
                    d.isAuthenticated = m.isAuthenticated(),
                    d.isAuthenticated ? i.canWriteRecords(b.user, b.token).then(function(a) {
                        j(a, c).then(function() {
                            e.$broadcast(t.loggedIn),
                            g.resolve(d)
                        })
                    }) : (d.error = "Unknown error logging in.",
                    j(!1, !1),
                    g.resolve(d)))
                })
            }).error(function(a, b) {
                var c = _.values(a).join(" ");
                a.username && (c = "Username field required."),
                a.password && (c = "Password field required.");
                var d = {
                    isAuthenticated: !1,
                    status: b,
                    error: c
                };
                g.resolve(d)
            }),
            g.promise
        }
        ,
        m.getToken = function() {
            return d.getObject(p)
        }
        ,
        m.getUserId = function() {
            var a = parseInt(d.getObject(o), 10);
            return isNaN(a) ? -1 : a
        }
        ,
        m.hasWriteAccess = function() {
            return d.getObject(n) || !1
        }
        ,
        m.isAdmin = function() {
            return d.getObject(q) || !1
        }
        ,
        m.logout = function() {
            l(null),
            d.remove(p, {
                path: "/"
            }),
            j(!1, !1).then(function() {
                e.$broadcast(t.loggedOut),
                r && (f.cancel(r),
                r = null),
                g.location.href = [h.api.hostname, "/api-auth/logout/?next=", g.location.href].join("")
            })
        }
        ,
        m
    }
    a.$inject = ["$log", "$q", "$http", "$cookies", "$rootScope", "$timeout", "$window", "ASEConfig", "UserService"],
    angular.module("ase.auth").factory("AuthService", a)
}(),
function() {
    "use strict";
    function a(a, c) {
        var d = {}
          , e = {
            logOutUser: "ASE:Auth:LogOutUser"
        };
        return d.events = e,
        d.responseError = function(d) {
            return 401 === d.status && b(d.config.url) && c.$broadcast(e.logOutUser),
            a.reject(d)
        }
        ,
        d
    }
    function b(a) {
        var b = document.createElement("a");
        return b.href = a,
        b.hostname === window.location.hostname
    }
    a.$inject = ["$q", "$rootScope"],
    angular.module("ase.auth").factory("LogoutInterceptor", a)
}(),
function() {
    "use strict";
    angular.module("json-editor", [])
}(),
function() {
    "use strict";
    function a() {
        function a(a) {
            return JSONEditor.defaults.custom_validators.push(a)
        }
        function b() {
            return JSONEditor.defaults.custom_validators.pop()
        }
        function c() {
            JSONEditor.defaults.custom_validators = []
        }
        function d(a, b) {
            JSONEditor.defaults.languages.en[a] = b
        }
        var e = {
            customValidators: {
                push: a,
                pop: b,
                clear: c
            },
            addTranslation: d
        };
        return e
    }
    angular.module("json-editor").service("JsonEditorDefaults", a)
}(),
function() {
    "use strict";
    function a(a) {
        function c(c, d) {
            var e = null
              , f = d[0]
              , g = null;
            c.$watch("options", function(a) {
                if (a && a.schema) {
                    var d = angular.extend({}, b, c.options)
                      , h = null;
                    if (e && (h = e.getValue(),
                    e.off("change", g),
                    e.destroy(),
                    e = null),
                    e = new JSONEditor(f,d),
                    null !== h) {
                        var i = e.getValue();
                        angular.extend(i, d.startval, h),
                        e.setValue(i)
                    }
                    g = e.on("change", function() {
                        var a = e.getValue()
                          , b = e.validate();
                        c.$apply(function() {
                            c.onDataChange()(a, b, e)
                        })
                    })
                }
            }),
            d.on("$destroy", function() {
                a.customValidators.clear()
            })
        }
        var d = {
            restrict: "E",
            scope: {
                editorId: "@",
                options: "=",
                onDataChange: "&"
            },
            link: c
        };
        return d
    }
    var b = {};
    a.$inject = ["JsonEditorDefaults"],
    angular.module("json-editor").directive("jsonEditor", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.defaults.stripTrailingSlashes = !1
    }
    a.$inject = ["$resourceProvider"],
    angular.module("ase.resources", ["ngResource", "ase.config", "ngFileUpload"]).config(a)
}(),
function() {
    "use strict";
    function a(a) {
        return a("builder-schemas/:name.json", {
            name: "@name"
        }, {
            get: {
                method: "GET"
            }
        })
    }
    a.$inject = ["$resource"],
    angular.module("ase.resources").factory("BuilderSchemas", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d) {
        var e = d.api.hostname + "/api/boundaries/"
          , f = a(e + ":uuid/ ", {
            uuid: "@uuid"
        }, {
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return angular.fromJson(a).results
                },
                isArray: !0
            },
            update: {
                method: "PATCH"
            }
        });
        return f.create = function(a, d, f, g, h) {
            if (a && a.length) {
                var i = a[0];
                c.upload({
                    url: e,
                    method: "POST",
                    fields: {
                        label: d,
                        color: f
                    },
                    file: i,
                    fileFormDataName: "source_file"
                }).progress(function(a) {
                    var c = parseInt(100 * a.loaded / a.total, 10);
                    b.debug("progress: " + c + "% " + a.config.file.name)
                }).success(g).error(h)
            }
        }
        ,
        f.errorMessage = function(a) {
            var b;
            return b = 409 === a ? "Uniqueness violation - verify that your geography label is unique" : "Error - ensure that all fields have appropriate values"
        }
        ,
        f
    }
    a.$inject = ["$resource", "$log", "Upload", "ASEConfig"],
    angular.module("ase.resources").factory("Geography", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        return a(b.api.hostname + "/api/recordschemas/:id/", {
            id: "@uuid",
            limit: "all"
        }, {
            create: {
                method: "POST"
            },
            get: {
                method: "GET"
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return angular.fromJson(a).results
                },
                isArray: !0
            },
            update: {
                method: "PATCH"
            }
        })
    }
    a.$inject = ["$resource", "ASEConfig"],
    angular.module("ase.resources").factory("RecordSchemas", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        var c = b.api.hostname + "/api/recordtypes/:id/";
        return a(c, {
            id: "@uuid",
            limit: "all"
        }, {
            create: {
                method: "POST"
            },
            get: {
                method: "GET"
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return angular.fromJson(a).results
                },
                isArray: !0
            },
            update: {
                method: "PATCH"
            }
        })
    }
    a.$inject = ["$resource", "ASEConfig"],
    angular.module("ase.resources").factory("RecordTypes", a)
}(),
function() {
    "use strict";
    angular.module("ase.schemas", [])
}(),
function() {
    "use strict";
    function a() {
        function a(a, b) {
            a.minimum < a.maximum ? (b.minimum = a.minimum,
            b.maximum = a.maximum) : a.minimum && 0 === a.maximum ? b.minimum = a.minimum : a.maximum && 0 === a.minimum && (b.maximum = a.maximum)
        }
        function b(a) {
            var b = "driver " + a.replace(/[\x00-\x1F\x7F-\x9F.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            return b.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(a, b) {
                return 0 === +a ? "" : 0 === b ? a.toLowerCase() : a.toUpperCase()
            })
        }
        function c(a, b, c, d, e) {
            var f;
            return "integer" !== a.fieldType ? f = k.FieldTypes[a.fieldType].toProperty(a, b, c, d, e) : (f = k.FieldTypes.number.toProperty(a, b, c, d, e),
            f.type = "integer"),
            f.isSearchable = a.isSearchable,
            f.fieldType = a.fieldType,
            f.propertyOrder = b,
            f
        }
        function d(a, b, d) {
            var e = {
                properties: {},
                type: "object"
            };
            e = h(e),
            _.each(a, function(a, f, g) {
                e.properties[a.fieldTitle] = c(a, f, g, b, d)
            });
            var f = _.pluck(_.filter(a, function(a) {
                return a.isRequired
            }), "fieldTitle");
            return e.required = e.required.concat(f),
            e
        }
        function e(a) {
            var b = [];
            return _.each(a.properties, function(c, d) {
                if (j[d])
                    ;
                else {
                    var e = {
                        fieldTitle: d
                    };
                    "checkbox" === c.format ? (e.fieldType = "selectlist",
                    e.displayType = "checkbox",
                    _.each(c, function(a, b) {
                        switch (b) {
                        case "items":
                            e.fieldOptions = a["enum"];
                            break;
                        case "type":
                        case "format":
                        case "uniqueItems":
                            break;
                        default:
                            e[b] = a
                        }
                    })) : _.each(c, function(a, b) {
                        switch (b) {
                        case "enum":
                            e.fieldOptions = a;
                            break;
                        case "format":
                            e.textOptions = a;
                            break;
                        case "type":
                            break;
                        case "media":
                            break;
                        case "watch":
                            e.referenceTarget = a.target;
                            break;
                        case "enumSource":
                            break;
                        default:
                            e[b] = a
                        }
                    });
                    var f = _.findIndex(a.required, function(a) {
                        return a === d
                    });
                    f >= 0 ? e.isRequired = !0 : e.isRequired = !1,
                    b.push(e)
                }
            }),
            b.sort(function(a, b) {
                return a.propertyOrder < b.propertyOrder ? -1 : a.propertyOrder > b.propertyOrder ? 1 : 0
            }),
            b
        }
        function f(a) {
            var b = []
              , c = _.countBy(a, function(a) {
                return a.fieldTitle
            });
            return _.forEach(c, function(a, c) {
                a > 1 && b.push({
                    message: 'Invalid schema: The field title "' + c + '" is used more than once.'
                })
            }),
            b
        }
        function g(a) {
            return angular.extend(a, {
                $schema: "http://json-schema.org/draft-04/schema#"
            })
        }
        function h(a) {
            return a.properties = angular.extend(a.properties, {
                _localId: {
                    type: "string",
                    pattern: "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$",
                    options: {
                        hidden: !0
                    }
                }
            }),
            a.required ? a.required = a.required.concat(["_localId"]) : a.required = ["_localId"],
            a
        }
        function i(a) {
            return a = a || {},
            angular.extend({}, {
                type: "object",
                title: "",
                plural_title: "",
                description: "",
                properties: {},
                definitions: {}
            }, a)
        }
        var j = {
            _localId: !0
        }
          , k = {
            JsonObject: i,
            FieldTypes: {
                text: {
                    toProperty: function(a) {
                        var b = {
                            type: "string",
                            format: a.textOptions
                        };
                        return a.isRequired && (b.minLength = 1),
                        b
                    }
                },
                number: {
                    toProperty: function(b) {
                        var c = {
                            type: "number",
                            minimum: void 0,
                            maximum: void 0
                        };
                        return a(b, c),
                        c
                    }
                },
                selectlist: {
                    toProperty: function(a) {
                        return "checkbox" === a.displayType ? {
                            type: "array",
                            format: "checkbox",
                            uniqueItems: !0,
                            items: {
                                type: "string",
                                "enum": a.fieldOptions
                            }
                        } : {
                            type: "string",
                            "enum": a.fieldOptions,
                            displayType: a.displayType
                        }
                    }
                },
                image: {
                    toProperty: function() {
                        return {
                            type: "string",
                            media: {
                                binaryEncoding: "base64",
                                type: "image/jpeg"
                            }
                        }
                    }
                },
                reference: {
                    toProperty: function(a, b, c, d) {
                        var e = []
                          , f = _.filter(_.keys(d.definitions[a.referenceTarget].properties), function(a) {
                            return !j[a]
                        });
                        f.sort();
                        for (var g = 0; 3 > g && g < f.length; g++)
                            e.push("{{item." + f[g] + "}}");
                        return {
                            type: "string",
                            watch: {
                                target: a.referenceTarget
                            },
                            enumSource: [{
                                source: "target",
                                title: e.join(" "),
                                value: "{{item._localId}}"
                            }]
                        }
                    }
                }
            },
            addVersion4Declaration: g,
            addRelatedContentFields: h,
            validateSchemaFormData: f,
            definitionFromSchemaFormData: d,
            schemaFormDataFromDefinition: e,
            generateFieldName: b
        };
        return k
    }
    angular.module("ase.schemas").service("Schemas", a)
}(),
function() {
    "use strict";
    angular.module("driver.audit", ["driver.config", "driver.resources", "ngFileSaver"])
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g) {
        function h() {
            n.pending = !1,
            n.error = null,
            n.months = o,
            n.currentYear = l.getFullYear(),
            n.currentMonth = l.getMonth(),
            n.selectedYear = n.currentYear,
            n.selectedMonth = n.currentMonth,
            i(),
            n.onDateChange = i,
            n.onDownloadClicked = j,
            n.close = function() {
                a.close()
            }
        }
        function i() {
            n.error = null,
            n.selectedYear === n.currentYear ? (n.months = _.slice(o, 0, n.currentMonth + 1),
            n.selectedMonth >= n.months.length && (n.selectedMonth = n.months.length - 1)) : n.months = o
        }
        function j() {
            n.pending = !0;
            var a = n.selectedYear
              , b = n.selectedMonth
              , d = b + 1
              , h = new Date(a,d,0).getDate()
              , i = moment.tz([a, b], m).toISOString()
              , j = moment.tz([a, b, h, 23, 59, 59, 999], m).toISOString();
            e.csv({
                min_date: i,
                max_date: j
            }).$promise.then(function(b) {
                "" === b.data ? n.error = c.instant("ERRORS.NO_AUDIT_RECORDS") : f.saveAs(new g([b.data],{
                    type: "application/csv"
                }), k(a, d)),
                n.pending = !1
            })
        }
        function k(a, b) {
            return "audit-log-" + b + "-" + a + ".csv"
        }
        var l = new Date
          , m = d.localization.timeZone
          , n = this
          , o = ["MONTH.JANUARY", "MONTH.FEBRUARY", "MONTH.MARCH", "MONTH.APRIL", "MONTH.MAY", "MONTH.JUNE", "MONTH.JULY", "MONTH.AUGUST", "MONTH.SEPTEMBER", "MONTH.OCTOBER", "MONTH.NOVEMBER", "MONTH.DECEMBER"];
        h()
    }
    a.$inject = ["$modalInstance", "$scope", "$translate", "WebConfig", "AuditLogs", "FileSaver", "Blob"],
    angular.module("driver.audit").controller("AuditDownloadModalController", a)
}(),
function() {
    "use strict";
    angular.module("ase.notifications", ["ngSanitize"])
}(),
function() {
    "use strict";
    function a(a, b) {
        function c() {
            return g
        }
        function d() {
            f && (b.cancel(f),
            f = null),
            g = null
        }
        function e(b) {
            var c = {
                timeout: 0,
                closeButton: !0,
                html: "",
                text: "",
                imageClass: "glyphicon-warning-sign",
                displayClass: "alert-info"
            }
              , d = angular.extend({}, c, b);
            g = d,
            a.$broadcast("ase.notifications.show", d)
        }
        var f = null
          , g = null
          , h = {
            hide: d,
            show: e,
            activeAlert: c
        };
        return h
    }
    a.$inject = ["$rootScope", "$timeout"],
    angular.module("ase.notifications").factory("Notifications", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/notifications/notifications-partial.html",
            controller: "NotificationsController",
            controllerAs: "ntf",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.notifications").directive("aseNotifications", a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        function d() {
            function d(a, c) {
                e.alert = c,
                e.active = !0,
                c.timeout && (f = b(g, c.timeout))
            }
            function g() {
                e.active = !1,
                f && (b.cancel(f),
                f = null,
                e.alert = null),
                c.hide()
            }
            e.alert = {},
            e.alertHeight = 0,
            e.hideAlert = g,
            a.$on("ase.notifications.show", d),
            c.activeAlert() && d(null, c.activeAlert())
        }
        var e = this
          , f = null;
        d()
    }
    a.$inject = ["$scope", "$timeout", "Notifications"],
    angular.module("ase.notifications").controller("NotificationsController", a)
}(),
function() {
    "use strict";
    angular.module("driver.navbar", ["ase.auth", "driver.state", "driver.audit", "ui.bootstrap", "ui.router"])
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
        function p() {
            s(),
            t(),
            q(c.current),
            r(),
            E = !0
        }
        function q(a) {
            var b = ["NAV.MAP", "NAV.RECORD_LIST"];
            D.isFilterPage = _.contains(b, a.label)
        }
        function r() {
            D.stateSelected = c.current,
            D.availableStates = _(c.get()).map(function(a) {
                return c.get(a)
            }).filter(function(a) {
                return a.showInNavbar && a.name !== c.get().name
            }).value()
        }
        function s() {
            D.languages = k.getAvailableLanguages(),
            D.selectedLanguage = k.getSelected(),
            a.isRightToLeft = !!D.selectedLanguage.rtl
        }
        function t() {
            D.authenticated = g.isAuthenticated(),
            D.hasWriteAccess = g.hasWriteAccess(),
            D.isAdmin = g.isAdmin(),
            n.getUser(g.getUserId()).then(function(a) {
                a && a.email ? D.userEmail = a.email : D.userEmail = F
            })
        }
        function u() {
            D.stateSelected && c.go(D.stateSelected.name)
        }
        function v(a) {
            i.setSelected(a)
        }
        function w(a) {
            h.setSelected(a)
        }
        function x(a) {
            m.setSelected(a)
        }
        function y(a) {
            D.stateSelected = a,
            u()
        }
        function z(a) {
            D.selectedLanguage = a,
            k.setSelected(a),
            f.location.reload()
        }
        function A(a) {
            y(c.get(a))
        }
        function B(a) {
            return a && a.data && D.geographySelected ? a.data[D.geographySelected.display_field] : e.instant("NAV.ALL")
        }
        function C() {
            d.open({
                templateUrl: "scripts/audit/audit-download-modal-partial.html",
                controller: "AuditDownloadModalController as modal",
                size: "sm",
                backdrop: "static"
            })
        }
        var D = this
          , E = !1
          , F = "My Account";
        j.ready().then(p),
        D.onLogoutButtonClicked = g.logout,
        D.onGeographySelected = v,
        D.onBoundarySelected = w,
        D.onRecordTypeSelected = x,
        D.onStateSelected = y,
        D.onLanguageSelected = z,
        D.navigateToStateName = A,
        D.showAuditDownloadModal = C,
        D.getBoundaryLabel = B,
        D.recordTypesVisible = o.recordType.visible,
        D.showDuplicateRecordsLink = o.duplicateRecordsLink.visible,
        D.userEmail = F,
        a.$on("$stateChangeSuccess", function(a, b) {
            s(),
            t(),
            q(b),
            r()
        }),
        b.$watch("ctl.authenticated", function(a, b) {
            a && !b && (i.getOptions().then(function(a) {
                D.geographyResults = a
            }),
            m.getOptions().then(function(a) {
                D.recordTypeResults = a
            }))
        }),
        b.$on("driver.state.recordstate:options", function(a, b) {
            D.recordTypeResults = b
        }),
        b.$on("driver.state.recordstate:selected", function(a, b) {
            D.recordTypeSelected = b,
            u()
        }),
        b.$on("driver.state.boundarystate:options", function(a, b) {
            D.boundaryResults = b
        }),
        b.$on("driver.state.boundarystate:selected", function(a, b) {
            D.boundarySelected = b,
            u(),
            l.setLocation(null),
            l.setZoom(null)
        }),
        b.$on("driver.state.geographystate:options", function(a, b) {
            D.geographyResults = b
        }),
        b.$on("driver.state.geographystate:selected", function(a, b) {
            D.geographySelected = b,
            E && h.updateOptions({
                boundary: b.uuid
            }).then(function() {
                u()
            })
        })
    }
    a.$inject = ["$rootScope", "$scope", "$state", "$modal", "$translate", "$window", "AuthService", "BoundaryState", "GeographyState", "InitialState", "LanguageState", "MapState", "RecordState", "UserService", "WebConfig"],
    angular.module("driver.navbar").controller("NavbarController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/navbar/navbar-partial.html",
            controller: "NavbarController",
            controllerAs: "ctl",
            bindToController: !0
        };
        return a
    }
    angular.module("driver.navbar").directive("driverNavbar", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.defaults.stripTrailingSlashes = !1
    }
    a.$inject = ["$resourceProvider"],
    angular.module("driver.resources", ["ngResource", "driver.config", "driver.state"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b) {
        return a(b.api.hostname + "/api/audit-log/", {
            format: "csv"
        }, {
            csv: {
                method: "GET",
                isArray: !1,
                transformResponse: function(a) {
                    return {
                        data: a
                    }
                }
            }
        })
    }
    a.$inject = ["$resource", "WebConfig"],
    angular.module("driver.resources").factory("AuditLogs", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        return a(b.api.hostname + "/api/boundaries/:id/", {
            id: "@uuid",
            limit: "all"
        }, {
            create: {
                method: "POST"
            },
            get: {
                method: "GET"
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return angular.fromJson(a).results
                },
                isArray: !0
            },
            update: {
                method: "PATCH"
            }
        })
    }
    a.$inject = ["$resource", "WebConfig"],
    angular.module("driver.resources").factory("Boundaries", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        var c = b.api.hostname + "/api/duplicates/:id/";
        return a(c, {
            id: "@uuid",
            limit: "all",
            resolved: "False"
        }, {
            get: {
                method: "GET"
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return angular.fromJson(a)
                },
                isArray: !1
            },
            update: {
                method: "PATCH"
            },
            resolve: {
                method: "PATCH",
                url: c + "resolve/"
            }
        })
    }
    a.$inject = ["$resource", "WebConfig"],
    angular.module("driver.resources").factory("Duplicates", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f(a) {
            g();
            var e = b.defer();
            return k.create({
                tilekey: a
            }, function(a) {
                var b = a.taskid;
                h = d(function() {
                    k.get({
                        id: b
                    }).$promise.then(function(a) {
                        switch (a.status) {
                        case "PENDING":
                            break;
                        case "STARTED":
                            break;
                        case "FAILURE":
                            e.reject(a.error),
                            g();
                            break;
                        case "SUCCESS":
                            e.resolve(a.result),
                            g()
                        }
                    })
                }, i, 1e3 * j / i),
                h.then(function() {
                    g(),
                    e.reject(c.instant("ERRORS.EXPORT_TIMED_OUT"))
                })
            }, function() {
                e.reject(c.instant("ERRORS.EXPORT_INITIALIZATION_ERROR"))
            }),
            e
        }
        function g() {
            d.cancel(h)
        }
        var h, i = 1500, j = 100, k = a(e.api.hostname + "/api/csv-export/:id/", {
            id: "@uuid"
        }, {
            create: {
                method: "POST"
            },
            get: {
                method: "GET"
            }
        }), l = {
            exportCSV: f,
            cancelPolling: g
        };
        return l
    }
    a.$inject = ["$resource", "$q", "$translate", "$interval", "WebConfig"],
    angular.module("driver.resources").factory("RecordExports", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        return a(b.api.hostname + "/api/boundarypolygons/:id/", {
            id: "@uuid",
            limit: "all"
        }, {
            create: {
                method: "POST"
            },
            get: {
                method: "GET",
                params: {
                    nogeom: !0
                }
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return angular.fromJson(a).results
                },
                isArray: !0,
                params: {
                    nogeom: !0
                }
            },
            update: {
                method: "PATCH"
            }
        })
    }
    a.$inject = ["$resource", "WebConfig"],
    angular.module("driver.resources").factory("Polygons", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        var c = b.api.hostname + "/api/records/";
        return a(c + ":id/", {
            id: "@uuid",
            archived: "False"
        }, {
            create: {
                method: "POST"
            },
            get: {
                method: "GET"
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return angular.fromJson(a).results
                },
                isArray: !0
            },
            update: {
                method: "PATCH"
            },
            toddow: {
                url: c + "toddow/",
                method: "GET",
                isArray: !0
            },
            stepwise: {
                url: c + "stepwise/",
                method: "GET",
                isArray: !0
            },
            recentCounts: {
                method: "GET",
                url: c + "recent_counts/"
            },
            report: {
                url: c + "crosstabs/",
                method: "GET"
            },
            socialCosts: {
                url: c + "costs/",
                method: "GET"
            }
        })
    }
    a.$inject = ["$resource", "WebConfig"],
    angular.module("driver.resources").factory("Records", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h) {
        function i(b, c, d, e) {
            var f = a.defer();
            return c = c || {},
            d = _.extend({}, m, d),
            e = e !== !1,
            k(b, d, e).then(function(a) {
                g.get(_.extend(a, c)).$promise.then(function(a) {
                    f.resolve(a)
                })
            }),
            f.promise
        }
        function j(b) {
            var c = a.defer()
              , e = b.__searchText
              , f = _.cloneDeep(_.omit(b, "__searchText"));
            return _.each(f, function(a, b) {
                if (a.contains)
                    if (a.contains.length) {
                        var c = _.map(a.contains, function(a) {
                            return [a]
                        });
                        a.contains = a.contains.concat(c)
                    } else
                        delete f[b]
            }),
            d.getFilterables().then(function(a) {
                _.each(f, function(b, c) {
                    delete a[c]
                }),
                _.each(a, function(b, c) {
                    "selectlist" !== b.fieldType && "text" !== b.fieldType ? delete a[c] : (a[c] = {},
                    a[c].pattern = e,
                    b.multiple ? a[c]._rule_type = "containment_multiple" : a[c]._rule_type = "containment")
                }),
                e && (f = _.merge(f, a));
                var b = {};
                _.each(f, function(a, c) {
                    b = _.merge(b, l(c.split("#"), a))
                }),
                c.resolve(b)
            }),
            c.promise
        }
        function k(d, g, i) {
            g = _.extend({}, m, g);
            var j, k, l, o = a.defer(), p = {
                limit: h.record.limit
            };
            if (g.doAttrFilters) {
                var q = b.getDateFilter();
                if (p.occurred_max = q.maxDate,
                p.occurred_min = q.minDate,
                h.filters.createdDate.visible) {
                    var r = b.getCreatedFilter();
                    p.created_max = r.maxDate,
                    p.created_min = r.minDate
                }
                var s = b.getCreatedByFilter();
                s && (p.created_by = s);
                var t = b.getQualityChecksFilter();
                t.checkOutsideBoundary && (k = f.getSelected().then(function(a) {
                    return a && a.uuid ? {
                        outside_boundary: a.uuid
                    } : {}
                }));
                var u = b.getWeatherFilter();
                u && (p.weather = u)
            }
            return g.doBoundaryFilter && (j = e.getSelected().then(function(a) {
                return a && a.uuid ? {
                    polygon_id: a.uuid
                } : {}
            })),
            g.doJsonFilters && (l = n.assembleJsonFilterParams(_.omit(b.filters, b.getNonJsonFilterNames())).then(function(a) {
                return _.isEmpty(a) ? {} : {
                    jsonb: a
                }
            })),
            i && (p = _.extend(p, {
                details_only: "True"
            })),
            a.all([j, k, l]).then(function(a) {
                d && (p.offset = d),
                _.forEach(a, function(a) {
                    _.extend(p, a)
                }),
                c.getSelected().then(function(a) {
                    p.record_type = a.uuid,
                    o.resolve(p)
                })
            }),
            o.promise
        }
        function l(a, b) {
            var c = {};
            return 1 === a.length ? (c[a[0]] = b,
            c) : (c[a[0]] = l(_.tail(a), b),
            c)
        }
        var m = {
            doAttrFilters: !0,
            doBoundaryFilter: !0,
            doJsonFilters: !0
        }
          , n = {
            djangoQuery: i,
            assembleParams: k,
            assembleJsonFilterParams: j
        };
        return n
    }
    a.$inject = ["$q", "FilterState", "RecordState", "RecordSchemaState", "BoundaryState", "GeographyState", "Records", "WebConfig"],
    angular.module("driver.resources").factory("QueryBuilder", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f(b, c) {
            var f = a.defer();
            return b = b || {},
            c = c || {},
            e.assembleParams(0, c, !0).then(function(a) {
                a = _.extend(a, b),
                a.limit && delete a.limit,
                d.toddow(a).$promise.then(function(a) {
                    f.resolve(a)
                })
            }),
            f.promise
        }
        function g(b, c) {
            var f = a.defer();
            return b = b || {},
            c = c || {},
            e.assembleParams(0, c, !0).then(function(a) {
                a = _.extend(a, b),
                a.limit && delete a.limit,
                d.stepwise(a).$promise.then(function(a) {
                    f.resolve(a)
                })
            }),
            f.promise
        }
        function h() {
            var b = a.defer()
              , c = {
                doAttrFilters: !1,
                doBoundaryFilter: !0,
                doJsonFilters: !1
            };
            return e.assembleParams(0, c, !0).then(function(a) {
                a.limit && delete a.limit,
                d.recentCounts(a).$promise.then(function(a) {
                    b.resolve(a)
                })
            }),
            b.promise
        }
        function i(b, c) {
            var f = a.defer();
            return b = b || {},
            c = c || {},
            e.assembleParams(0, c, !0).then(function(a) {
                a = _.extend(a, b),
                a.limit && delete a.limit,
                d.socialCosts(a).$promise.then(function(a) {
                    f.resolve(a)
                }, function(a) {
                    f.reject({
                        error: a
                    })
                })
            }),
            f.promise
        }
        var j = {
            recentCounts: h,
            socialCosts: i,
            toddow: f,
            stepwise: g
        };
        return j
    }
    a.$inject = ["$q", "RecordTypes", "RecordState", "Records", "QueryBuilder"],
    angular.module("driver.resources").factory("RecordAggregates", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        return a(b.api.hostname + "/api/userfilters/:id/", {
            id: "@uuid"
        }, {
            create: {
                method: "POST"
            },
            get: {
                method: "GET"
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return angular.fromJson(a).results
                },
                isArray: !0
            },
            update: {
                method: "PATCH"
            }
        })
    }
    a.$inject = ["$resource", "WebConfig"],
    angular.module("driver.resources").factory("SavedFilters", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        return a(b.api.hostname + "/api/blackspots/:id/", {
            id: "@uuid",
            limit: "all"
        }, {
            create: {
                method: "POST"
            },
            get: {
                method: "GET"
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return a ? angular.fromJson(a).results : []
                },
                isArray: !0
            },
            update: {
                method: "PATCH"
            }
        })
    }
    function b(a, b) {
        return a(b.api.hostname + "/api/blackspotsets/:id/", {
            id: "@uuid",
            limit: "all"
        }, {
            create: {
                method: "POST"
            },
            get: {
                method: "GET"
            },
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return a ? angular.fromJson(a).results : []
                },
                isArray: !0
            },
            update: {
                method: "PATCH"
            }
        })
    }
    a.$inject = ["$resource", "WebConfig"],
    b.$inject = ["$resource", "WebConfig"],
    angular.module("driver.resources").factory("Blackspots", a).factory("BlackspotSets", b)
}(),
function() {
    "use strict";
    function a(a, b) {
        return a(b.api.hostname + "/api/assignments/:id/", {
            id: "@uuid",
            limit: "all"
        }, {
            query: {
                method: "GET",
                transformResponse: function(a) {
                    return a ? angular.fromJson(a) : []
                },
                isArray: !0
            }
        })
    }
    a.$inject = ["$resource", "WebConfig"],
    angular.module("driver.resources").factory("Assignments", a)
}(),
function() {
    "use strict";
    angular.module("driver.state", ["ase.resources", "debounce", "driver.resources", "LocalStorageModule", "ui.router"])
}(),
function() {
    "use strict";
    function a(a, b) {
        function c() {
            var a = b.defer();
            return e() ? a.resolve() : n.push(a),
            a.promise
        }
        function d() {
            e() && (_.each(n, function(a) {
                a.resolve()
            }),
            n = [])
        }
        function e() {
            return j && k && l && m
        }
        function f() {
            j = !0,
            d()
        }
        function g() {
            k = !0,
            d()
        }
        function h() {
            l = !0,
            d()
        }
        function i() {
            m = !0,
            d()
        }
        var j = !1
          , k = !1
          , l = !1
          , m = !1
          , n = []
          , o = {
            ready: c,
            setRecordTypeInitialized: f,
            setBoundaryInitialized: g,
            setGeographyInitialized: h,
            setLanguageInitialized: i
        };
        return a.onReady(i),
        o
    }
    a.$inject = ["$translate", "$q"],
    angular.module("driver.state").factory("InitialState", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d) {
        function e(a, b) {
            s && (p.filters = a,
            c.set(q, a),
            b && c.set(r, b))
        }
        function f() {
            c.remove(q),
            c.remove(r),
            p.filters = {}
            localStorage.removeItem('DRIVER.web.filterbar.filters')
        }
        function g() {
            a.$broadcast("driver.filterbar:send")
        }
        function h(b) {
            b || (b = c.get(q),
            b = b ? b : {});
            var d = c.get(d);
            d = d ? d : null,
            a.$broadcast("driver.filterbar:restore", [b, d]),
            p.filters = b,
            s = !0
        }
        function i(a, b) {
            var c = moment.duration({
                days: 90
            })
              , e = new Date
              , f = new Date(e - c);
            b && (e = b.maxDate || e,
            f = b.minDate || f),
            p.filters && p.filters.hasOwnProperty(a) && (e = moment(p.filters[a].max).format("YYYY-MM-DD"),
            f = moment(p.filters[a].min).format("YYYY-MM-DD"));
            var g = {};
            if (f) {
                var h = moment.tz(f, d.localization.timeZone).startOf("day");
                isNaN(h.unix()) || (g.minDate = h.toISOString())
            }
            if (e) {
                var i = moment.tz(e, d.localization.timeZone).endOf("day");
                isNaN(i.unix()) || (g.maxDate = i.toISOString())
            }
            return g
        }
        function j(a) {
            return i("__dateRange", a)
        }
        function k(a) {
            return i("__createdRange", a)
        }
        function l() {
            return p.filters.__createdBy
        }
        function m() {
            return p.filters.__weather
        }
        function n() {
            var a = {};
            return _.forEach(p.filters.__quality, function(b) {
                a[b] = !0
            }),
            a
        }
        function o() {
            return ["__dateRange", "__createdRange", "__createdBy", "__quality", "__weather"]
        }
        var p = this
          , q = "filterbar.filters"
          , r = "filterbar.geofilter"
          , s = !1;
        return p.getFilters = g,
        p.restoreFilters = h,
        p.getDateFilter = j,
        p.getCreatedFilter = k,
        p.getCreatedByFilter = l,
        p.getWeatherFilter = m,
        p.getQualityChecksFilter = n,
        p.getNonJsonFilterNames = o,
        p.saveFilters = b(e, 500),
        p.reset = f,
        p.filters = {},
        p
    }
    a.$inject = ["$rootScope", "debounce", "localStorageService", "WebConfig"],
    angular.module("driver.state").factory("FilterState", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        function c(a) {
            k = a
        }
        function d() {
            return k
        }
        function e(a) {
            l = a
        }
        function f() {
            return l || 5
        }
        function g(a) {
            m = a
        }
        function h() {
            return m
        }
        function i(a) {
            n = a,
            b.set(p, a)
        }
        function j() {
            return n || (n = b.get(p)),
            n || o[0]
        }
        var k, l, m, n, o = _.map(a.baseLayers(), "slugLabel"), p = "map.baseLayerSlugLabel", q = {
            setFilterGeoJSON: c,
            getFilterGeoJSON: d,
            setZoom: e,
            getZoom: f,
            setLocation: g,
            getLocation: h,
            setBaseLayerSlugLabel: i,
            getBaseLayerSlugLabel: j
        };
        return q
    }
    a.$inject = ["BaseLayersService", "localStorageService"],
    angular.module("driver.state").factory("MapState", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g) {
        function h() {
            p = null,
            s = !1,
            u = !1,
            r = [],
            o = {
                active: "True"
            },
            x.updateOptions()
        }
        function i(c) {
            var d = angular.extend({}, c, o);
            return f.query(d).$promise.then(function(c) {
                r = c,
                b.$broadcast("driver.state.recordstate:options", r),
                c.length ? !p && r[0] ? p = x.setSelected(r[0]) : _.includes(r, p) || x.setSelected(p) : a.warn("No record types returned")
            })
        }
        function j() {
            if (!u) {
                u = !0;
                var a = c.defer();
                r ? a.resolve(r) : i().then(function() {
                    a.resolve(r)
                }),
                v = a.promise
            }
            return v.then(function() {
                u = !1
            }),
            v
        }
        function k(a) {
            if (!w) {
                if (g.recordType.visible) {
                    var c = d.get("recordtype.selected");
                    c && (a = _.find(r, function(a) {
                        return a.uuid === c.uuid
                    }))
                } else
                    a = _.find(r, function(a) {
                        return a.label === g.recordType.primaryLabel
                    });
                l()
            }
            return p = _.find(r, function(b) {
                return b.uuid === a.uuid
            }) ? a : r.length ? r[0] : null,
            d.set("recordtype.selected", p),
            b.$broadcast("driver.state.recordstate:selected", p),
            w || (w = !0,
            e.setRecordTypeInitialized()),
            p
        }
        function l() {
            q = _.find(r, function(a) {
                return a.label === g.recordType.secondaryLabel
            }),
            d.set("secondaryrecordtype.selected", q)
        }
        function m() {
            if (s)
                return t;
            s = !0;
            var a = c.defer();
            return p || r.length ? p ? a.resolve(p) : a.resolve(k()) : i().then(function() {
                a.resolve(p)
            }),
            t = a.promise,
            t.then(function() {
                s = !1
            }),
            t
        }
        function n() {
            return w ? c.resolve(q) : m().then(function() {
                return q
            })
        }
        var o, p, q, r, s, t, u, v, w = !1, x = this;
        return x.updateOptions = i,
        x.getOptions = j,
        x.setSelected = k,
        x.getSelected = m,
        x.getSecondary = n,
        h(),
        x
    }
    a.$inject = ["$log", "$rootScope", "$q", "localStorageService", "InitialState", "RecordTypes", "WebConfig"],
    angular.module("driver.state").factory("RecordState", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f() {
            i = null,
            j = !1
        }
        function g(a) {
            return h(a).then(function(a) {
                var b;
                b = a.schema && a.schema.definitions ? a.schema.definitions : {};
                var c = {};
                _.forEach(b, function(a, b) {
                    _.forEach(a.properties, function(d, e) {
                        c[b + "#" + e] = _.merge(d, {
                            multiple: a.multiple
                        })
                    })
                });
                var d = function(a) {
                    return a.isSearchable
                }
                  , e = {};
                return _.forEach(c, function(a, b) {
                    d(a) && (e[b] = a)
                }),
                e
            })
        }
        function h(a) {
            if (a || (a = l),
            j && a === l)
                return k;
            j = !0,
            l = a;
            var b = c.defer();
            return i && i.uuid === a ? b.resolve(i) : e.get({
                id: a
            }).$promise.then(function(a) {
                i = a,
                b.resolve(a)
            }),
            k = b.promise,
            k.then(function() {
                j = !1
            }),
            k
        }
        var i, j, k, l, m = this;
        return m.get = h,
        m.getFilterables = g,
        f(),
        m
    }
    a.$inject = ["$log", "$rootScope", "$q", "localStorageService", "RecordSchemas"],
    angular.module("driver.state").factory("RecordSchemaState", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g) {
        function h() {
            n = r,
            o = [],
            m = {
                active: "True"
            },
            e.getSelected().then(function(a) {
                var b = a ? {
                    boundary: a.uuid
                } : {};
                q.updateOptions(b)
            })
        }
        function i(c) {
            var d = angular.extend({}, m, c);
            return g.query(d).$promise.then(function(c) {
                o = c,
                b.$broadcast("driver.state.boundarystate:options", o),
                c.length ? n && n.uuid ? _.includes(o, n) || q.setSelected(n) : q.setSelected(r) : a.warn("No boundaries returned");
            })
        }
        function j() {
            var a = c.defer();
            return _.isEmpty(o) ? i().then(function() {
                a.resolve(o)
            }) : a.resolve(o),
            a.promise
        }
        function k(a) {
            if (!p) {
                var c = d.get("boundary.selected");
                a = c ? _.find(o, function(a) {
                    return a.uuid === c.uuid
                }) : r,
                p = !0,
                f.setBoundaryInitialized()
            }
            return n = _.find(o, function(b) {
                return a ? b.uuid === a.uuid : !1
            }) ? a : r,
            d.set("boundary.selected", n),
            b.$broadcast("driver.state.boundarystate:selected", n),
            n
        }
        function l() {
            var a = c.defer();
            return n ? a.resolve(n) : i().then(function() {
                a.resolve(n)
            }),
            a.promise
        }
        var m, n, o, p = !1, q = this, r = {
            uuid: ""
        };
        return q.updateOptions = i,
        q.getOptions = j,
        q.setSelected = k,
        q.getSelected = l,
        h(),
        q
    }
    a.$inject = ["$log", "$rootScope", "$q", "localStorageService", "GeographyState", "InitialState", "Polygons"],
    angular.module("driver.state").service("BoundaryState", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f) {
        function g() {
            m = null,
            n = [],
            l = {}
        }
        function h(c) {
            var d = c || l;
            return f.query(d).$promise.then(function(c) {
                n = c,
                b.$broadcast("driver.state.geographystate:options", n),
                c.length ? !m && n[0] ? m = p.setSelected(n[0]) : _.includes(n, m) || p.setSelected(m) : a.warn("No geographies returned")
            })
        }
        function i() {
            return _.isEmpty(n) ? h().then(function() {
                return n
            }) : c.when(n)
        }
        function j(a) {
            if (!o) {
                var c = _.find(n, function(a) {
                    var b = d.get("geography.selected");
                    return b ? a.uuid === b.uuid : {
                        uuid: ""
                    }
                });
                c && (a = c),
                o = !0,
                e.setGeographyInitialized()
            }
            return m = _.find(n, function(b) {
                return b.uuid === a.uuid
            }) ? a : n.length ? n[0] : null,
            d.set("geography.selected", m),
            b.$broadcast("driver.state.geographystate:selected", m),
            m
        }
        function k() {
            var a = c.defer();
            return m ? a.resolve(m) : h().then(function() {
                a.resolve(m)
            }),
            a.promise
        }
        var l, m, n, o = !1, p = this;
        return p.updateOptions = h,
        p.getOptions = i,
        p.setSelected = j,
        p.getSelected = k,
        g(),
        p
    }
    a.$inject = ["$log", "$rootScope", "$q", "localStorageService", "InitialState", "Geography"],
    angular.module("driver.state").factory("GeographyState", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        function c(a, b, c, e) {
            a.$on("driver.state.boundarystate:selected", function() {
                e.getMap().then(d)
            })
        }
        function d(b) {
            a.getSelected().then(function(a) {
                a.bbox ? b.fitBounds(a.bbox) : (b.setZoom(f.zoom),
                b.panTo(f.center))
            })
        }
        var e = {
            restrict: "A",
            scope: !1,
            replace: !1,
            controller: "",
            require: "leafletMap",
            link: c
        }
          , f = b.get();
        return e
    }
    a.$inject = ["BoundaryState", "LeafletDefaults"],
    angular.module("driver.state").directive("zoomToBoundary", a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        function d(d, e, f, g) {
            g.getMap().then(function(d) {
                var e = function(a) {
                    var b = a.split(",");
                    return 2 !== b.length || isNaN(b[0]) || isNaN(b[1]) ? null : [parseFloat(b[0]), parseFloat(b[1])]
                }
                  , f = function(a) {
                    null !== a && d.setView([parseFloat(a[0]), parseFloat(a[1])], 16)
                }
                  , g = function(c) {
                    b.forward(c).then(function(a) {
                        0 !== a.length && f([a[0].lat, a[0].lon])
                    })["catch"](function(b) {
                        a.error("Failed to get Pickpoint data:"),
                        a.error(b.status),
                        a.error(b.data)
                    })
                };
                L.Control.AddressSearch = L.Control.extend({
                    onAdd: function() {
                        var a = L.DomUtil.create("div")
                          , b = L.DomUtil.create("input", "address-search-input", a)
                          , c = L.DomUtil.create("button", "address-search-button", a);
                        return L.DomUtil.create("span", "glyphicon glyphicon-search", c),
                        c.id = "address-search-button",
                        b.id = "address-search-input",
                        b.placeholder = "Zoom to",
                        b.type = "text",
                        L.DomEvent.addListener(c, "click", function() {
                            var a = document.getElementById("address-search-input").value
                              , b = e(a);
                            null === b ? g(a) : f(b)
                        }),
                        L.DomEvent.addListener(b, "keyup", function(a) {
                            a.preventDefault(),
                            13 === a.keyCode && document.getElementById("address-search-button").click()
                        }),
                        L.DomEvent.disableClickPropagation(a),
                        a
                    }
                }),
                L.control.addressSearch = function(a) {
                    return new L.Control.AddressSearch(a)
                }
                ,
                c.addressSearch.visible && L.control.addressSearch({
                    position: "topleft"
                }).addTo(d)
            })
        }
        var e = {
            restrict: "A",
            scope: !1,
            replace: !1,
            controller: "",
            require: "leafletMap",
            link: d
        };
        return e
    }
    a.$inject = ["$log", "Nominatim", "WebConfig"],
    angular.module("driver.state").directive("zoomToAddress", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        function c() {
            var b = a.get(g);
            b && (i = _.find(h, function(a) {
                return a.id === b
            })),
            i = i || h[0]
        }
        function d(b) {
            i = b;
            var c = b ? b.id : null;
            a.set(g, c)
        }
        function e() {
            return i || c(),
            i
        }
        function f() {
            return h
        }
        var g = "language.selectedId"
          , h = b.localization.languages
          , i = null
          , j = {
            getAvailableLanguages: f,
            getSelected: e,
            setSelected: d
        };
        return c(),
        j
    }
    a.$inject = ["localStorageService", "WebConfig"],
    angular.module("driver.state").factory("LanguageState", a)
}(),
function() {
    "use strict";
    angular.module("driver.nominatim", ["driver.config"])
}(),
function() {
    "use strict";
    function a(a, b) {
        function c(c, d) {
            var g = {
                key: b.nominatim.key,
                q: c,
                countrycodes: b.localization.countryCode,
                limit: f,
                addressdetails: 1
            };
            return d && (g.viewBox = d.join(",")),
            a.get(e + "forward", {
                params: g
            }).then(function(a) {
                return a.data
            })
        }
        function d(c, d) {
            return a.get(e + "reverse", {
                params: {
                    key: b.nominatim.key,
                    format: "json",
                    lat: d,
                    lon: c
                }
            }).then(function(a) {
                return a.data
            })
        }
        var e = "https://api.pickpoint.io/v1/"
          , f = 15
          , g = {
            forward: c,
            reverse: d
        };
        return g
    }
    a.$inject = ["$http", "WebConfig"],
    angular.module("driver.nominatim").service("Nominatim", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.filterbar", ["ase.auth", "debounce", "driver.resources", "driver.state", "driver.localization", "ui.bootstrap"]).config(a)
}(),
function() {
    "use strict";
    function a() {
        return function(a) {
            if (!a)
                return "";
            var b = a.split("#");
            return b[b.length - 1]
        }
    }
    angular.module("driver.filterbar").filter("labelFormatter", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/filterbar/filterbar.html",
            controller: "FilterbarController",
            controllerAs: "filterbar"
        };
        return a
    }
    angular.module("driver.filterbar").directive("driverFilterbar", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i) {
        function j() {
            n.userCanAdd = f.hasWriteAccess(),
            h.getSelected().then(function(a) {
                k(a)
            })
        }
        function k(a) {
            a && (n.recordLabel = a.label,
            e.getFilterables(a.current_schema).then(function(a) {
                n.filterables = a,
                c(function() {
                    g.restoreFilters()
                })
            }))
        }
        function l() {
            g.reset(),
            b.$broadcast("driver.filterbar:reset"),
            c(n.sendFilter)
        }
        function m() {
            a.open({
                templateUrl: "scripts/saved-filters/saved-filters-modal-partial.html",
                controller: "SavedFiltersModalController as modal",
                size: "lg"
            })
        }
        var n = this;
        return n.filters = {},
        n.filterPolygon = null,
        n.recordLabel = "",
        n.reset = l,
        n.showSavedFiltersModal = m,
        n.userCanAdd = !1,
        n.hasWriteAccess = f.hasWriteAccess(),
        n.showWeatherFilter = i.filters.weather.visible,
        n.showCreatedByFilter = i.filters.createdBy.visible,
        n.showCreatedDateFilter = n.hasWriteAccess && i.filters.createdDate.visible,
        j(),
        n.updateFilter = function(a, b) {
            b || 0 === b ? n.filters[a] = angular.copy(b) : delete n.filters[a],
            g.saveFilters(n.filters),
            n.sendFilter()
        }
        ,
        n.setFilterPolygon = function(a) {
            n.filterPolygon = a ? a : null,
            g.saveFilters(n.filters, n.filterPolygon),
            n.sendFilter()
        }
        ,
        n.sendFilter = d(function() {
            b.$emit("driver.filterbar:changed")
        }, 500),
        b.$on("driver.filterbar:send", function() {
            n.sendFilter()
        }),
        b.$on("driver.state.recordstate:selected", function(a, b) {
            k(b)
        }),
        b.$on("driver.filterbar:restore", function(a, c) {
            var d, e = _.keys(n.filterables), f = n.filters.__dateRange;
            n.filters = c[0],
            n.filterPolygon = c[1],
            !n.filters.__dateRange && f && (n.filters.__dateRange = f),
            _.each(g.getNonJsonFilterNames(), function(a) {
                n.filters[a] && e.push(a)
            }),
            _.each(e, function(a) {
                d = n.filters[a] ? n.filters[a] : {
                    contains: []
                },
                b.$broadcast("driver.filterbar:restored", {
                    label: a,
                    value: d
                })
            }),
            b.$broadcast("driver.filterbar:polygonrestored", n.filterPolygon),
            n.sendFilter()
        }),
        b.$on("driver.views.map:filterdrawn", function(a, b) {
            n.setFilterPolygon(b)
        }),
        n
    }
    a.$inject = ["$modal", "$scope", "$timeout", "debounce", "RecordSchemaState", "AuthService", "FilterState", "RecordState", "WebConfig"],
    angular.module("driver.filterbar").controller("FilterbarController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "A",
            require: ["^driver-filterbar", "text-search-field"],
            templateUrl: "scripts/filterbar/text-search.html",
            controller: "textSearchController",
            scope: !0,
            link: function(a, b, c, d) {
                function e() {
                    a.searchText = ""
                }
                function f() {
                    h.updateFilter(g, a.searchText)
                }
                var g = c.textSearchField
                  , h = d[0];
                "__createdBy" === g ? a.placeholderLabel = "RECORD.FILTER_CREATED_BY" : a.placeholderLabel = "RECORD.FILTER_BY",
                a.$on("driver.filterbar:reset", function() {
                    e()
                }),
                a.$on("driver.filterbar:restored", function(b, c) {
                    c.label === g && (a.searchText = c.value)
                }),
                a.$watch("searchText", function() {
                    f()
                }),
                e()
            }
        };
        return a
    }
    angular.module("driver.filterbar").directive("textSearchField", a)
}(),
function() {
    "use strict";
    function a() {
        var a = this;
        return a
    }
    angular.module("driver.filterbar").controller("textSearchController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "A",
            require: ["^driver-filterbar", "numeric-range-field"],
            templateUrl: "scripts/filterbar/numeric-range.html",
            controller: "numericRangeController",
            scope: {
                data: "=",
                label: "="
            },
            link: function(a, b, c, d) {
                function e() {
                    a.filter = {
                        _rule_type: "intrange"
                    },
                    a.error = {}
                }
                var f = d[0]
                  , g = d[1];
                e(),
                a.$on("driver.filterbar:restored", function() {
                    e()
                }),
                a.$on("driver.filterbar:restored", function(b, c) {
                    c.label === a.label && (a.filter = c.value,
                    a.isMinMaxValid())
                }),
                a.$on("driver.filterbar:reset", function() {
                    a.filter.min = null,
                    a.filter.max = null,
                    a.updateFilter(a.label, a.filter)
                }),
                a.updateFilter = function(b, c) {
                    a.isMinMaxValid() && f.updateFilter(b, c)
                }
                ,
                a.isMinMaxValid = function() {
                    var b = g.isMinMaxValid(a.filter.min, a.filter.max);
                    return a.error = g.error,
                    b
                }
            }
        };
        return a
    }
    angular.module("driver.filterbar").directive("numericRangeField", a)
}(),
function() {
    "use strict";
    function a() {
        var a = this;
        return a.error = {},
        a.isMinMaxValid = function(b, c) {
            if ("number" == typeof b && "number" == typeof c) {
                var d = c >= b;
                return d ? (a.error.classes = "",
                a.error.btnClasses = "") : (a.error.classes = "alert-danger",
                a.error.btnClasses = ""),
                d
            }
            return a.error.classes = "",
            a.error.btnClasses = "",
            !0
        }
        ,
        a
    }
    angular.module("driver.filterbar").controller("numericRangeController", a)
}(),
function() {
    "use strict";
    function a(a) {
        var b = {
            restrict: "A",
            require: ["^driver-filterbar", "date-range-field"],
            templateUrl: "scripts/filterbar/date-range.html",
            controller: "dateRangeController",
            scope: !0,
            link: function(b, c, d, e) {
                function f(c, d) {
                    b[d] = i.formatDate(b.calendarOptions.dateFormat, c);
                    var e = a.convertToCalendar(c, "gregorian", "en")
                      , f = e._calendar.toJSDate(e).toJSON();
                    l[d] = f,
                    b.updateFilter()
                }
                function g() {
                    var d = a.currentDateFormats();
                    i = $.calendars.instance(d.calendar, d.language),
                    $.calendarsPicker.setDefaults($.calendarsPicker.regionalOptions[""]),
                    b.calendarOptions = angular.extend({
                        calendar: i,
                        dateFormat: d.formats.numeric,
                        showAnim: "",
                        onShow: function(a) {
                            a.on("click", function(a) {
                                a.stopPropagation()
                            }),
                            a.find(".calendars-cmd").on("click", function(a) {
                                a.stopPropagation()
                            })
                        }
                    }, $.calendarsPicker.regionalOptions[d.language]),
                    c.on("hide.bs.dropdown", function() {
                        $(".date-range-input").calendarsPicker("hide")
                    })
                }
                function h() {
                    g();
                    var a = new Date
                      , d = new Date(moment(a) - moment.duration({
                        days: 90
                    }));
                    $(c).find(".dt-max-field").calendarsPicker(b.calendarOptions).calendarsPicker("setDate", i.fromJSDate(a)).calendarsPicker("option", "onSelect", function(a) {
                        a.length > 0 && f(a[0], "max")
                    }),
                    $(c).find(".dt-min-field").calendarsPicker(b.calendarOptions).calendarsPicker("setDate", i.fromJSDate(d)).calendarsPicker("option", "onSelect", function(a) {
                        a.length > 0 && f(a[0], "min")
                    }),
                    b.min = i.formatDate(b.calendarOptions.dateFormat, i.fromJSDate(d)),
                    b.max = i.formatDate(b.calendarOptions.dateFormat, i.fromJSDate(a)),
                    b.error = {},
                    b.updateFilter()
                }
                var i = null
                  , j = e[0]
                  , k = e[1]
                  , l = {};
                "__createdRange" === d.dateRangeField ? (b.helpLabel = "RECORD.CREATED_FILTER",
                b.buttonLabel = "COMMON.CREATED_RANGE") : (b.helpLabel = "RECORD.DATE_FILTER",
                b.buttonLabel = "COMMON.DATE_RANGE"),
                b.$on("driver.filterbar:reset", function() {
                    h()
                }),
                b.$on("driver.filterbar:restored", function(a, e) {
                    if (e.label === d.dateRangeField) {
                        if (l.min = e.value.min,
                        l.max = e.value.max,
                        l.min) {
                            var f = moment(l.min, moment.ISO_8601).toDate();
                            b.min = i.formatDate(b.calendarOptions.dateFormat, i.fromJSDate(f)),
                            $(c).find(".dt-min-field").calendarsPicker("setDate", i.fromJSDate(f))
                        }
                        if (l.max) {
                            var g = moment(l.max, moment.ISO_8601).toDate();
                            b.max = i.formatDate(b.calendarOptions.dateFormat, i.fromJSDate(g)),
                            $(c).find(".dt-max-field").calendarsPicker("setDate", i.fromJSDate(g))
                        }
                        b.isMinMaxValid()
                    }
                }),
                b.updateFilter = function() {
                    b.isMinMaxValid() && j.updateFilter(d.dateRangeField, l)
                }
                ,
                b.isMinMaxValid = function() {
                    var a = k.isMinMaxValid({
                        min: l.min,
                        max: l.max
                    });
                    return b.error = k.error,
                    a
                }
                ,
                b.onDtRangeChange = function(a) {
                    "min" === a ? $(c).find(".dt-min-field").calendarsPicker("setDate", b.min) : "max" === a && $(c).find(".dt-max-field").calendarsPicker("setDate", b.max)
                }
                ,
                h()
            }
        };
        return b
    }
    a.$inject = ["DateLocalization"],
    angular.module("driver.filterbar").directive("dateRangeField", a)
}(),
function() {
    "use strict";
    function a() {
        var a = this;
        return a.error = {},
        a.isMinMaxValid = function(a) {
            var b, c;
            return a.min && (b = a.min),
            a.max && (c = a.max),
            c && b ? c >= b : c || b ? !0 : !1
        }
        ,
        a
    }
    angular.module("driver.filterbar").controller("dateRangeController", a)
}(),
function() {
    "use strict";
    function a(a) {
        var b = {
            restrict: "A",
            require: ["^driver-filterbar", "options-field"],
            templateUrl: "scripts/filterbar/options.html",
            controller: "optionsController",
            scope: {
                data: "=",
                label: "="
            },
            link: function(b, c, d, e) {
                function f(c) {
                    b.filter = {
                        contains: []
                    },
                    c && (b.domID = c),
                    a(function() {
                        $("#" + b.domID).selectpicker()
                    })
                }
                function g(c) {
                    $("#" + b.domID).val(c),
                    a(function() {
                        $("#" + b.domID).selectpicker("refresh"),
                        h(b.label)
                    })
                }
                function h(a) {
                    b.filter.contains.length ? b.data.multiple ? j.updateFilter(a, _.merge({
                        _rule_type: "containment_multiple"
                    }, b.filter)) : j.updateFilter(a, _.merge({
                        _rule_type: "containment"
                    }, b.filter)) : j.updateFilter(a)
                }
                function i() {
                    function a() {
                        return Math.floor(65536 * (1 + Math.random())).toString(16).substring(1)
                    }
                    return a() + a() + "-" + a() + "-" + a() + "-" + a() + "-" + a() + a() + a()
                }
                var j = e[0];
                b.updateFilter = h,
                f(i()),
                b.$on("driver.filterbar:reset", function() {
                    b.filter.contains = [],
                    g([])
                }),
                b.$on("driver.filterbar:restored", function(a, c) {
                    c.label === b.label && (b.filter.contains = c.value.contains,
                    h(b.label))
                }),
                b.$watch("filter.contains", g)
            }
        };
        return b
    }
    a.$inject = ["$timeout"],
    angular.module("driver.filterbar").directive("optionsField", a)
}(),
function() {
    "use strict";
    function a() {
        var a = this;
        return a
    }
    angular.module("driver.filterbar").controller("optionsController", a)
}(),
function() {
    "use strict";
    function a(a) {
        var b = {
            restrict: "A",
            require: ["^driver-filterbar", "weather-field"],
            templateUrl: "scripts/filterbar/weather.html",
            controller: "weatherController",
            bindToController: !0,
            controllerAs: "ctl",
            scope: {},
            link: function(b, c, d, e) {
                function f() {
                    a(function() {
                        k.selectpicker()
                    })
                }
                function g(c) {
                    b.ctl.value = c,
                    a(function() {
                        k.selectpicker("refresh"),
                        k.val(c)
                    })
                }
                function h() {
                    i.updateFilter(b.ctl.label, b.ctl.value)
                }
                var i = e[0]
                  , j = e[1]
                  , k = angular.element(c[0]).find("select");
                b.ctl.updateFilter = h,
                b.ctl.weatherValues = j.weatherValues,
                b.ctl.label = "__weather",
                f(),
                b.$on("driver.filterbar:restored", function(a, c) {
                    c.label === b.ctl.label && g(c.value)
                }),
                b.$on("driver.filterbar:reset", function() {
                    g([]),
                    h()
                })
            }
        };
        return b
    }
    a.$inject = ["$timeout"],
    angular.module("driver.filterbar").directive("weatherField", a)
}(),
function() {
    "use strict";
    function a(a) {
        var b = this;
        return b.weatherValues = a.weatherValues.slice(1),
        b
    }
    a.$inject = ["WeatherService"],
    angular.module("driver.filterbar").controller("weatherController", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        var c = {
            restrict: "A",
            require: ["^driver-filterbar", "quality-field"],
            templateUrl: "scripts/filterbar/quality.html",
            controller: "qualityController",
            bindToController: !0,
            controllerAs: "ctl",
            scope: {},
            link: function(c, d, e, f) {
                function g() {
                    a(function() {
                        j.selectpicker()
                    })
                }
                function h() {
                    c.ctl.value && c.ctl.value.length > 0 ? i.updateFilter(c.ctl.label, c.ctl.value) : i.updateFilter(c.ctl.label, !1)
                }
                var i = f[0]
                  , j = angular.element(d[0]).find("select");
                c.ctl.label = e.qualityField,
                c.ctl.qualityChecks = [],
                b.qualityChecks.outsideBoundary.visible && c.ctl.qualityChecks.push({
                    key: "checkOutsideBoundary",
                    label: "RECORD.OUT_OF_BOUNDS"
                }),
                c.ctl.value = [],
                c.ctl.updateFilter = h,
                c.$on("driver.filterbar:reset", function() {
                    c.ctl.value = [],
                    c.ctl.updateFilter(),
                    a(function() {
                        j.selectpicker("refresh")
                    })
                }),
                c.$on("driver.filterbar:restored", function(b, d) {
                    d.label === c.ctl.label && (c.ctl.value = d.value,
                    a(function() {
                        j.selectpicker("refresh")
                    }))
                }),
                g()
            }
        };
        return c
    }
    a.$inject = ["$timeout", "WebConfig"],
    angular.module("driver.filterbar").directive("qualityField", a)
}(),
function() {
    "use strict";
    function a() {
        var a = this;
        return a
    }
    angular.module("driver.filterbar").controller("qualityController", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.socialCosts", ["driver.resources", "driver.state", "ui.bootstrap"]).config(a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "EA",
            templateUrl: function(a, b) {
                return b.asTool && "true" === b.asTool ? "scripts/social-costs/social-costs-tool.html" : "scripts/social-costs/social-costs.html"
            },
            controller: "SocialCostsController",
            controllerAs: "ctl",
            bindToController: !0,
            scope: {
                costData: "<",
                asTool: "@"
            }
        };
        return a
    }
    angular.module("driver.socialCosts").directive("driverSocialCosts", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        function c() {
            e.state = "total",
            e.toggle = d
        }
        function d() {
            "total" === e.state ? (e.state = "subtotal",
            a.$broadcast("driver.tools.costs.open")) : e.state = "total"
        }
        var e = this;
        e.$onInit = c,
        b.$on("driver.tools.export.open", function() {
            e.state = "total"
        }),
        b.$on("driver.tools.interventions.open", function() {
            e.state = "total"
        }),
        b.$on("driver.tools.charts.open", function() {
            e.state = "total"
        })
    }
    a.$inject = ["$rootScope", "$scope"],
    angular.module("driver.socialCosts").controller("SocialCostsController", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.recentCounts", ["driver.resources", "driver.state", "ui.bootstrap"]).config(a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "EA",
            templateUrl: "scripts/recent-counts/recent-counts.html",
            controller: "RecentCountsController",
            controllerAs: "recent"
        };
        return a
    }
    angular.module("driver.recentCounts").directive("driverRecentCounts", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d) {
        function e() {
            d.getSelected().then(function(a) {
                g.recordTypePlural = a.plural_label,
                f()
            }),
            a.$on("driver.state.boundarystate:selected", function() {
                f()
            })
        }
        function f() {
            c.recentCounts().then(function(a) {
                g.year = a.year,
                g.quarter = a.quarter,
                g.month = a.month
            })
        }
        var g = this;
        return b.ready().then(e),
        g
    }
    a.$inject = ["$scope", "InitialState", "RecordAggregates", "RecordState"],
    angular.module("driver.recentCounts").controller("RecentCountsController", a)
}(),
function() {
    "use strict";
    angular.module("driver.blackSpots", ["ui.bootstrap", "ui.router", "driver.state", "Leaflet", "driver.map-layers"])
}(),
function() {
    "use strict";
    function a(a) {
        function b(b, c, d, e) {
            a.ready().then(function() {
                var a = e[0]
                  , b = e[1];
                b.initMap(a)
            })
        }
        var c = {
            restrict: "A",
            scope: !1,
            replace: !0,
            controller: "BlackSpotsController",
            require: ["leafletMap", "driver-black-spots"],
            link: b
        };
        return c
    }
    a.$inject = ["InitialState"],
    angular.module("driver.blackSpots").directive("driverBlackSpots", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g) {
        function h(a) {
            a.getMap().then(i).then(m).then(j)
        }
        function i(a) {
            var b = c.baseLayers();
            return a.addLayer(b[0].layer),
            n.layerSwitcher || (n.layerSwitcher = L.control.layers(_.zipObject(_.map(b, "label"), _.map(b, "layer"))),
            n.layerSwitcher.addTo(a)),
            a
        }
        function j(a) {
            return e.getSelected().then(k).then(function(b) {
                var c = l(b)
                  , d = new L.tileLayer(c,{
                    attribution: "PRS",
                    detectRetina: !0,
                    zIndex: 6
                });
                d.addTo(a)
            }),
            a
        }
        function k(a) {
            return g.query({
                /*effective_at: d.getDateFilter().maxDate,*/
                record_type: a ? a.uuid : ""
            }).$promise
        }
        function l(a) {
            return a.length > 0 ? b.blackspotsUrl(a[a.length - 1].uuid) : ""
        }
        function m(a) {
            return f.getSelected().then(function(b) {
                b.bbox && a.fitBounds(b.bbox)
            }),
            a
        }
        var n = this;
        n.map = null,
        n.initMap = h
    }
    a.$inject = ["InitialState", "TileUrlService", "BaseLayersService", "FilterState", "RecordState", "BoundaryState", "BlackspotSets"],
    angular.module("driver.blackSpots").controller("BlackSpotsController", a)
}(),
function() {
    "use strict";
    angular.module("driver.savedFilters", ["ase.notifications", "ui.bootstrap", "ui.router", "driver.resources"])
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "EA",
            scope: {
                compact: "="
            },
            templateUrl: "scripts/saved-filters/saved-filters-partial.html",
            bindToController: !0,
            replace: !0,
            controller: "SavedFiltersController",
            controllerAs: "filters"
        };
        return a
    }
    angular.module("driver.savedFilters").directive("driverSavedFilters", a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        function d() {
            c.query({
                limit: h
            }).$promise.then(function(a) {
                g.savedFilters = a
            })
        }
        function e(a) {
            c["delete"]({
                id: a.uuid
            }).$promise.then(function() {
                d()
            })
        }
        function f(b) {
            a.$emit("driver.savedFilters:filterSelected", b.filter_json)
        }
        var g = this
          , h = 50;
        return g.savedFilters = null,
        g.deleteFilter = e,
        g.viewFilter = f,
        a.$on("driver.state.savedfilter:refresh", d),
        b.ready().then(d),
        g
    }
    a.$inject = ["$scope", "InitialState", "SavedFilters"],
    angular.module("driver.savedFilters").controller("SavedFiltersController", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g) {
        function h() {
            c.$on("driver.savedFilters:filterSelected", function(a, b) {
                e.restoreFilters(b),
                j()
            })
        }
        function i() {
            if (l.label) {
                var a = _.cloneDeep(e.filters);
                a.hasOwnProperty("__dateRange") && delete a.__dateRange,
                a.hasOwnProperty("__createdRange") && delete a.__createdRange;
                var c = {
                    label: l.label,
                    filter_json: a
                };
                g.create(c, function() {
                    l.label = "",
                    b.$broadcast("driver.state.savedfilter:refresh")
                }, function(a) {
                    k(["<p>" + m + "</p><p>", a.status, ": ", a.statusText, "</p>"].join(""))
                })
            }
        }
        function j() {
            a.close()
        }
        function k(a) {
            f.show({
                displayClass: "alert-danger",
                header: n,
                html: a
            })
        }
        var l = this;
        l.label = "",
        l.save = i,
        l.closeModal = j;
        var m = d.instant("ERRORS.SAVING_FILTER_ERROR")
          , n = d.instant("ERRORS.FILTER_NOT_SAVED");
        return h(),
        l
    }
    a.$inject = ["$modalInstance", "$rootScope", "$scope", "$translate", "FilterState", "Notifications", "SavedFilters"],
    angular.module("driver.savedFilters").controller("SavedFiltersModalController", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        function c(a) {
            return !isNaN(parseFloat(a)) && isFinite(a)
        }
        var d = a.instant("SAVED_FILTERS.SEARCH_TEXT")
          , e = a.instant("SAVED_FILTERS.TEXT_SEARCH")
          , f = a.instant("RECORD.OUT_OF_BOUNDS")
          , g = a.instant("RECORD.CREATED_BY")
          , h = a.instant("ERRORS.UNKNOWN_RULE_TYPE")
          , i = a.instant("RECORD.WEATHER");
        return function(j, k) {
            k = k || '<span class="divider">|</span>';
            var l = [];
            return _.forOwn(j, function(j, k) {
                var m = "<b>" + k.split("#")[1] + "</b>: ";
                switch (j._rule_type) {
                case "containment_multiple":
                case "containment":
                    j.pattern ? l.push(d + ": " + j.pattern) : l.push(m + j.contains.join(", "));
                    break;
                case "intrange":
                    if (c(j.min) || c(j.max)) {
                        var n = m;
                        n += c(j.min) && c(j.max) ? j.min + "-" + j.max : c(j.min) ? "&gt; " + j.min : "&lt; " + j.max,
                        l.push(n)
                    } else
                        ;break;
                default:
                    if ("__searchText" === k)
                        l.push("<strong>" + e + ":</strong> " + j);
                    else if ("__weather" === k) {
                        var o = _.map(j, function(c) {
                            return a.instant(b("weatherLabel")(c))
                        }).join(", ");
                        l.push("<strong>" + i + ":</strong> " + o)
                    } else
                        "__quality" === k ? l.push("<strong>" + f + "</strong>") : "__createdBy" === k ? l.push("<strong>" + g + ":</strong> " + j) : l.push(h + ": " + j._rule_type)
                }
            }),
            l.join(k)
        }
    }
    a.$inject = ["$translate", "$filter"],
    angular.module("driver.savedFilters").filter("savedFilterAsHTML", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("report", {
            url: "/report/?" + ["row_period_type", "row_boundary_id", "row_choices_path", "col_period_type", "col_boundary_id", "col_choices_path", "aggregation_boundary", "occurred_max", "occurred_min", "jsonb", "record_type", "polygon_id", "calendar"].join("&"),
            templateUrl: "scripts/custom-reports/custom-report-partial.html",
            label: "NAV.CUSTOM_REPORT",
            controller: "CustomReportController",
            controllerAs: "ctl",
            showInNavbar: !1
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("driver.customReports", ["ui.router", "ase.auth", "driver.config", "driver.resources", "driver.state", "driver.localization", "ui.bootstrap"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f() {
            if (m)
                return b.resolve(l);
            var f = c.getSelected().then(function(a) {
                return d.get(a.current_schema)
            })
              , n = [f, e.getOptions(), a.onReady()];
            return b.all(n).then(function(b) {
                var c = b[0]
                  , d = b[1];
                return i = a.instant("AGG.TIME"),
                j = "Geography", //a.instant("AGG.GEOGRAPHY"),
                k = a.instant("AGG.FILTER"),
                l = [{
                    label: a.instant("AGG.YEAR"),
                    value: "year",
                    type: i
                }, {
                    label: a.instant("AGG.MONTH"),
                    value: "month",
                    type: i
                }, {
                    label: a.instant("AGG.WEEK"),
                    value: "week",
                    type: i
                }, {
                    label: a.instant("AGG.DAY"),
                    value: "day",
                    type: i
                }, {
                    label: a.instant("AGG.MONTH_OF_YEAR"),
                    value: "month_of_year",
                    type: i
                }, {
                    label: a.instant("AGG.WEEK_OF_YEAR"),
                    value: "week_of_year",
                    type: i
                }, {
                    label: a.instant("AGG.DAY_OF_MONTH"),
                    value: "day_of_month",
                    type: i
                }, {
                    label: a.instant("AGG.DAY_OF_WEEK"),
                    value: "day_of_week",
                    type: i
                }, {
                    label: a.instant("AGG.HOUR_OF_DAY"),
                    value: "hour_of_day",
                    type: i
                }],
                g(c),
                h(d),
                l
            }).then(function(a) {
                return m = !0,
                a
            })
        }
        function g(a) {
            _.forEach(a.schema.definitions, function(a, b) {
                _.forEach(a.properties, function(a, c) {
                    if ("selectlist" === a.fieldType) {
                        var d = [b, "properties", c];
                        a.format && "checkbox" === a.format && d.push("items"),
                        l.push({
                            label: c,
                            value: d.join(","),
                            type: k
                        })
                    }
                })
            })
        }
        function h(a) {
            _.each(a, function(a) {
                l.push({
                    label: a.label,
                    value: a.uuid,
                    type: j
                })
            })
        }
        var i, j, k, l, m = !1, n = {
            getOptions: f
        };
        return n
    }
    a.$inject = ["$translate", "$q", "RecordState", "RecordSchemaState", "GeographyState"],
    angular.module("driver.customReports").service("AggregationsConfig", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i, j, k) {
        function l() {
            r.ready = !1,
            r.calendar = k.currentDateFormats().calendar,
            r.closeModal = m,
            r.createReport = q,
            r.onParamChanged = o,
            r.dateFormat = "long",
            r.colAggSelected = null,
            r.rowAggSelected = null,
            r.geoAggSelected = null,
            r.nonDateFilters = _.omit(f.filters, ["__dateRange", "__createdRange"]),
            r.dateFilter = f.getDateFilter(),
            g.getSelected().then(function(a) {
                h.getSelected().then(function(b) {
                    b && b.data ? r.boundaryFilter = b.data[a.display_field] : r.boundaryFilter = null
                })
            }),
            j.getOptions().then(function(a) {
                r.rowColAggs = a
            })
        }
        function m() {
            b.close()
        }
        function n(b, c, d) {
            var e = b + "_";
            if (c.type === s)
                e += "period_type";
            else if (c.type === u)
                e += "choices_path";
            else {
                if (c.type !== t)
                    return void a.error("Cannot set row/col param with type: ", c.type);
                e += "boundary_id"
            }
            d[e] = c.value
        }
        function o() {
            r.ready = !1,
            r.colAggSelected && r.rowAggSelected && p().then(function() {
                r.ready = !0
            })
        }
        function p() {
            return i.assembleParams(0).then(function(a) {
                var b = {};
                n("col", r.colAggSelected, b),
                n("row", r.rowAggSelected, b),
                r.geoAggSelected && "Geography" !== r.colAggSelected.type && "Geography" !== r.rowAggSelected.type && (b.aggregation_boundary = r.geoAggSelected.value),
                b.calendar = r.calendar,
                a = _.extend(a, b),
                a.limit && delete a.limit,
                r.params = a
            })
        }
        function q() {
            var a = _.mapValues(r.params, function(a) {
                return "object" == typeof a ? angular.toJson(a) : a
            });
            e.open(c.href("report", a, {
                absolute: !0
            }), "_blank")
        }
        var r = this
          , s = d.instant("AGG.TIME")
          , t = "Geography"
          , u = d.instant("AGG.FILTER");
        return r.$onInit = l(),
        r
    }
    a.$inject = ["$log", "$modalInstance", "$state", "$translate", "$window", "FilterState", "GeographyState", "BoundaryState", "QueryBuilder", "AggregationsConfig", "DateLocalization"],
    angular.module("driver.customReports").controller("CustomReportsModalController", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g) {
        function h() {
            l = d.instant("COMMON.TOTAL"),
            m.loading = !0,
            m.params = b,
            f.getSelected().then(function(a) {
                m.recordType = a
            }),
            c.all([i(), e.report(m.params).$promise]).then(function(a) {
                m.report = a[1],
                k()
            }, function(a) {
                m.error = a.data.detail
            })["finally"](function() {
                m.loading = !1
            })
        }
        function i() {
            return g.getOptions().then(function(a) {
                var b = _.find(a, function(a) {
                    return [m.params.row_period_type, m.params.row_boundary_id, m.params.row_choices_path].indexOf(a.value) >= 0
                });
                b ? m.rowCategoryLabel = b.label : m.rowCategoryLabel = "";
                var c = _.find(a, function(a) {
                    return [m.params.col_period_type, m.params.col_boundary_id, m.params.col_choices_path].indexOf(a.value) >= 0
                });
                return c ? m.colCategoryLabel = c.label : m.colCategoryLabel = "",
                [m.rowCategoryLabel, m.colCategoryLabel]
            })
        }
        function j(a) {
            return _.map(a, function(a) {
                return a.translate ? d.instant(a.text) : a.text
            }).join(" ")
        }
        function k() {
            var a = "<tr><th>" + m.rowCategoryLabel + "</th>";
            _.forEach(m.report.col_labels, function(b) {
                a += "<th>" + j(b.label) + "</th>"
            }),
            a += "<th>" + l + "</th></tr>",
            m.headerHTML = a,
            _.forEach(m.report.tables, function(a) {
                var b = "";
                _.forEach(m.report.row_labels, function(c) {
                    b += "<tr><td>" + j(c.label) + "</td>",
                    a.data[c.key] ? (_.forEach(m.report.col_labels, function(d) {
                        b += "<td>" + (a.data[c.key][d.key] || 0) + "</td>"
                    }),
                    b += "<td>" + a.row_totals[c.key] + "</td>") : (_.forEach(m.report.col_labels, function() {
                        b += "<td>0</td>"
                    }),
                    b += "<td>0</td>"),
                    b += "</tr>"
                }),
                a.bodyHTML = b
            })
        }
        var l, m = this;
        d.onReady(h)
    }
    a.$inject = ["$state", "$stateParams", "$q", "$translate", "Records", "RecordState", "AggregationsConfig"],
    angular.module("driver.customReports").controller("CustomReportController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "A",
            scope: {
                tableDataString: "="
            },
            link: function(a, b) {
                var c = a.$watch("tableDataString", function(a) {
                    b.html(a),
                    c()
                })
            }
        };
        return a
    }
    angular.module("driver.customReports").directive("tableDataString", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("assignments", {
            url: "/assignments/?" + ["num_personnel", "shift_start", "shift_end", "polygon_id", "polygon", "record_type"].join("&"),
            templateUrl: "scripts/enforcers/enforcer-assignments-partial.html",
            label: "NAV.ENFORCER_ASSIGNMENTS",
            controller: "EnforcerAssignmentsController",
            controllerAs: "ctl",
            showInNavbar: !1
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("driver.enforcers", ["ui.router", "ase.auth", "driver.config", "driver.resources", "driver.state", "driver.localization", "ui.bootstrap", "datetimepicker", "Leaflet"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h) {
        function i() {
            k.loading = !0,
            k.params = b,
            k.dateFormat = "long",
            k.printPage = j,
            k.areaName = "",
            f.query(k.params).$promise.then(function(a) {
                k.assignments = a
            }, function(a) {
                k.error = a.data.detail
            })["finally"](function() {
                k.loading = !1
            });
            var a = b.polygon_id;
            a ? h.get({
                id: a
            }).$promise.then(function(a) {
                g.get({
                    id: a.boundary
                }).$promise.then(function(b) {
                    k.areaName = a.data[b.display_field]
                })
            }) : k.areaName = "Custom Polygon"
        }
        function j() {
            e.print()
        }
        var k = this;
        d.onReady(i)
    }
    a.$inject = ["$state", "$stateParams", "$q", "$translate", "$window", "Assignments", "Boundaries", "Polygons"],
    angular.module("driver.enforcers").controller("EnforcerAssignmentsController", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.enforcers").controller("AssignmentMapController", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d) {
        function e(a, c, d, e) {
            b.ready().then(function() {
                var b = e[0]
                  , c = a.$eval(d.geom)
                  , g = L.polygon(i(c));
                b.getMap().then(function(a) {
                    f(a, g)
                })
            })
        }
        function f(a, b) {
            g(a),
            h(a, b)
        }
        function g(a) {
            var b = d.baseLayers();
            return a.addLayer(b[0].layer),
            a
        }
        function h(a, b) {
            return a.addLayer(b),
            a.fitBounds(b.getBounds()),
            a
        }
        function i(a) {
            if (2 === a.length) {
                var b = a[0];
                a[0] = a[1],
                a[1] = b
            } else
                angular.forEach(a, i);
            return a
        }
        var j = {
            restrict: "A",
            scope: !1,
            replace: !0,
            controller: "AssignmentMapController",
            require: ["leaflet-map", "assignmentMap"],
            link: e
        };
        return j
    }
    a.$inject = ["$timeout", "InitialState", "LeafletDefaults", "BaseLayersService"],
    angular.module("driver.enforcers").directive("assignmentMap", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i, j, k) {
        function l() {
            q.ready = !1,
            q.closeModal = m,
            q.createAssignments = o,
            q.onParamChanged = n,
            j.getSelected().then(function(a) {
                q.recordType = a.uuid
            }),
            i.getSelected().then(function(a) {
                h.getSelected().then(function(b) {
                    b && b.data ? (q.polygonId = b.uuid,
                    q.polygonName = b.data[a.display_field]) : (q.polygonId = null,
                    q.polygonName = null)
                })
            }),
            q.polygon = k.getFilterGeoJSON()
        }
        function m() {
            b.close()
        }
        function n() {
            f(function() {
                if (q.ready = !1,
                q.shiftStart && q.shiftEnd && q.numPersonnel) {
                    var a = moment(q.shiftStart)
                      , b = moment(q.shiftEnd)
                      , c = Math.abs(moment.duration(a.diff(b)).asHours());
                    c > p ? q.error = d.instant("ENFORCERS.SHIFT_LENGTH_ERROR") : (q.error = null,
                    q.ready = !0)
                }
            })
        }
        function o() {
            var a = {
                shift_start: q.shiftStart.toISOString(),
                shift_end: q.shiftEnd.toISOString(),
                polygon_id: q.polygonId,
                polygon: q.polygon,
                record_type: q.recordType,
                num_personnel: q.numPersonnel
            }
              , b = _.mapValues(a, function(a) {
                return "object" == typeof a && null !== a ? angular.toJson(a) : a
            });
            e.open(c.href("assignments", b, {
                absolute: !0
            }), "_blank")
        }
        var p = Math.abs(moment.duration(24, "hours").asHours())
          , q = this;
        return q.$onInit = l(),
        q
    }
    a.$inject = ["$log", "$modalInstance", "$state", "$translate", "$window", "$timeout", "FilterState", "BoundaryState", "GeographyState", "RecordState", "MapState"],
    angular.module("driver.enforcers").controller("EnforcersModalController", a)
}(),
function() {
    "use strict";
    angular.module("Leaflet", [])
}(),
function() {
    "use strict";
    function a(a, b) {
        function c() {
            g = b.defer(),
            f.getMap = d,
            f.setMap = e
        }
        function d() {
            return g.promise
        }
        function e(b) {
            g.resolve(b),
            a(function() {
                b.invalidateSize()
            }, 0)
        }
        var f = this
          , g = null;
        c()
    }
    function b(a) {
        function b(b, c, d, e) {
            var f = a.get()
              , g = new L.map(c[0],f);
            L.Icon.Default.imagePath || (L.Icon.Default.imagePath = "static/styles/images"),
            e.setMap(g)
        }
        var c = {
            restrict: "A",
            scope: {},
            controller: "LeafletController",
            controllerAs: "lf",
            bindToController: !0,
            link: b
        };
        return c
    }
    a.$inject = ["$timeout", "$q"],
    b.$inject = ["LeafletDefaults"],
    angular.module("Leaflet").controller("LeafletController", a).directive("leafletMap", b)
}(),
function() {
    "use strict";
    function a() {
        function a() {
            function a() {
                return angular.extend({}, c)
            }
            var b = {
                get: a
            };
            return b
        }
        var b = this
          , c = {
            center: [0, 0],
            zoom: 1,
            crs: L.CRS.EPSG3857
        };
        b.setDefaults = function(a) {
            angular.merge(c, a)
        }
        ,
        b.$get = a
    }
    angular.module("Leaflet").provider("LeafletDefaults", a)
}(),
function() {
    "use strict";
    angular.module("driver.localization", ["driver.config"])
}(),
function() {
    "use strict";
    function a(a, b) {
        function c(a) {
            var b = h[a];
            return void 0 === b && (b = h[""]),
            void 0 === b.language && (b.language = a),
            void 0 === b.calendar && (b.calendar = "gregorian"),
            b
        }
        function d() {
            return c(a.getSelected().id)
        }
        function e(a, b, c) {
            return $.calendars.instance(b, c).fromJD(a._calendar.toJD(a))
        }
        function f(d, e, f, g) {
            var h, i = moment(d).tz(b.localization.timeZone), j = new Date(i.format("MMM DD YYYY"));
            if (isNaN(j.getDate()))
                return "";
            var k = a.getSelected()
              , l = k.id;
            l || (l = "exclaim");
            var m = k.rtl;
            h = c(l);
            var n = $.calendars.instance(h.calendar, h.language).fromJSDate(j)
              , o = n.formatDate(h.formats[e], n);
            if (f) {
                var p = i.format(g ? "H:mm" : "H:mm:ss");
                o = m ? p + ", " + o : o + ", " + p
            }
            return o
        }
        function g(a, c) {
            var d = new Date(a)
              , e = d.getTimezoneOffset()
              , f = moment(d).tz(b.localization.timeZone)._offset
              , g = (e + f) * (c ? -1 : 1);
            return d.setMinutes(d.getMinutes() + g),
            d
        }
        var h = {
            "": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "mm/dd/yyyy",
                    "short": "M Y"
                }
            },
            af: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            am: {
                calendar: "ethiopian",
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            ar: {
                calendar: "islamic",
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            "ar-dz": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "ar-DZ"
            },
            "ar-eg": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "ar-EG"
            },
            "ar-sa": {
                calendar: "ummalqura",
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "ar"
            },
            az: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            bg: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            bn: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            bs: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yy",
                    "short": "M Y"
                }
            },
            ca: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            cs: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            da: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd-mm-yyyy",
                    "short": "M Y"
                }
            },
            de: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            "de-ch": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                },
                language: "de-CH"
            },
            el: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            "en-au": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "en-AU"
            },
            "en-gb": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "en-GB"
            },
            "en-nz": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "en-NZ"
            },
            "en-us": {
                formats: {
                    "long": "MM d, Y",
                    longNoTime: "MM d, Y",
                    numeric: "m/dd/yyyy",
                    "short": "M Y"
                },
                language: "en"
            },
            eo: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            es: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            "es-ar": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "es-AR"
            },
            "es-pe": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "es-PE"
            },
            et: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            eu: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy/mm/dd",
                    "short": "M Y"
                }
            },
            exclaim: {
                formats: {
                    "long": "MM d, Y",
                    longNoTime: "MM d, Y",
                    numeric: "m/dd/yyyy",
                    "short": "M Y"
                },
                language: "en"
            },
            fa: {
                calendar: "persian",
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy/mm/dd",
                    "short": "M Y"
                }
            },
            fi: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            fo: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd-mm-yyyy",
                    "short": "M Y"
                }
            },
            fr: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            "fr-ch": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                },
                language: "fr-CH"
            },
            gl: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            gu: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd-M-yyyy",
                    "short": "M Y"
                }
            },
            he: {
                calendar: "hebrew",
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            "hi-in": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "hi-IN"
            },
            hr: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy.",
                    "short": "M Y"
                }
            },
            hu: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy-mm-dd",
                    "short": "M Y"
                }
            },
            hy: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            id: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            is: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            it: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            ja: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy/mm/dd",
                    "short": "M Y"
                }
            },
            ka: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            km: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            ko: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy-mm-dd",
                    "short": "M Y"
                }
            },
            lo: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            lt: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy-mm-dd",
                    "short": "M Y"
                }
            },
            lv: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd-mm-yyyy",
                    "short": "M Y"
                }
            },
            me: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            "me-me": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "me-ME"
            },
            mk: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            ml: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            ms: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            mt: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            ne: {
                calendar: "nepali",
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            nl: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd-mm-yyyy",
                    "short": "M Y"
                }
            },
            "nl-be": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "nl-BE"
            },
            no: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            pa: {
                calendar: "nanakshahi",
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd-mm-yyyy",
                    "short": "M Y"
                }
            },
            pl: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy-mm-dd",
                    "short": "M Y"
                }
            },
            "pt-br": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "pt-BR"
            },
            rm: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            ro: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            ru: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            sk: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            sl: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            sq: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            sr: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            "sr-sr": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                },
                language: "sr-SR"
            },
            sv: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy-mm-dd",
                    "short": "M Y"
                }
            },
            ta: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            th: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            tr: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            tt: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd.mm.yyyy",
                    "short": "M Y"
                }
            },
            uk: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            ur: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            vi: {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd/mm/yyyy",
                    "short": "M Y"
                }
            },
            "zh-cn": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy-mm-dd",
                    "short": "M Y"
                },
                language: "zh-CN"
            },
            "zh-hk": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "dd-mm-yyyy",
                    "short": "M Y"
                },
                language: "zh-HK"
            },
            "zh-tw": {
                formats: {
                    "long": "d MM, Y",
                    longNoTime: "d MM, Y",
                    numeric: "yyyy/mm/dd",
                    "short": "M Y"
                },
                language: "zh-TW"
            }
        }
          , i = {
            getLocalizedDateString: f,
            currentDateFormats: d,
            convertToCalendar: e,
            convertNonTimezoneDate: g
        };
        return i
    }
    function b(a) {
        function b(b, c, d, e) {
            return a.getLocalizedDateString(new Date(Date.parse(b)), c, d, e)
        }
        return b
    }
    a.$inject = ["LanguageState", "WebConfig"],
    b.$inject = ["DateLocalization"],
    angular.module("driver.localization").factory("DateLocalization", a).filter("localizeRecordDate", b)
}(),
function() {
    "use strict";
    function a(a, b) {
        function c(c, g) {
            f = b.currentDateFormats(),
            e = $.calendars.instance(f.calendar, f.language),
            $.calendarsPicker.setDefaults($.calendarsPicker.regionalOptions[""]);
            var h = angular.extend({
                calendar: e,
                dateFormat: f.formats.numeric,
                showAnim: "",
                showTrigger: '<span class="input-group-addon picker"><span class="glyphicon glyphicon-calendar"></span></span>'
            }, $.calendarsPicker.regionalOptions[f.language]);
            $(g).calendarsPicker(h),
            a(function() {
                $(g).calendarsPicker("option", "onSelect", function(b) {
                    a(function() {
                        b.length > 0 && (d(c.datetime, b[0]),
                        c.onChange())
                    })
                })
            }),
            c.$watch(function() {
                return c.datetime
            }, function(a) {
                a && $(g).calendarsPicker("setDate", e.fromJSDate(a))
            })
        }
        function d(a, c) {
            var d = b.convertToCalendar(c, "gregorian", "en")
              , e = d._calendar.toJSDate(d);
            e.valueOf() !== a.valueOf() && a.setTime(e.getTime())
        }
        var e, f, g = {
            restrict: "E",
            templateUrl: "scripts/localization/date-picker-partial.html",
            scope: {
                datetime: "=",
                placeholder: "@",
                onChange: "&"
            },
            link: c,
            replace: !0
        };
        return g
    }
    a.$inject = ["$timeout", "DateLocalization"],
    angular.module("driver.localization").directive("azDatePicker", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/localization/datetime-picker-partial.html",
            controller: "azDateTimePickerController",
            controllerAs: "ctl",
            bindToController: !0,
            scope: {
                datetime: "=",
                onChange: "&"
            }
        };
        return a
    }
    function b() {
        function a() {
            var a = new Date;
            a.setMinutes(0),
            a.setSeconds(0),
            e.updateDate = c,
            e.updateTime = b,
            e.date = a,
            e.time = a,
            d()
        }
        function b() {
            d()
        }
        function c() {
            d()
        }
        function d() {
            var a = e.time.getHours()
              , b = e.time.getMinutes()
              , c = new Date(e.date);
            c.setHours(a),
            c.setMinutes(b),
            e.datetime = c,
            e.onChange()
        }
        var e = this;
        e.$onInit = a()
    }
    angular.module("driver.localization").directive("azDateTimePicker", a).controller("azDateTimePickerController", b)
}(),
function() {
    "use strict";
    angular.module("driver.details", ["angular-spinkit", "driver.config", "driver.localization", "driver.resources", "driver.weather", "ui.bootstrap", "ui.router", "Leaflet"])
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.details").controller("DetailsFieldController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                compact: "=",
                data: "=",
                property: "=",
                record: "=",
                recordSchema: "=",
                isSecondary: "<"
            },
            templateUrl: "scripts/details/details-field-partial.html",
            bindToController: !0,
            controller: "DetailsFieldController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsField", a)
}(),
function() {
    "use strict";
    function a() {
        var a = this;
        a.dateFormat = "long"
    }
    angular.module("driver.details").controller("DetailsConstantsController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                record: "<"
            },
            templateUrl: "scripts/details/details-constants-partial.html",
            bindToController: !0,
            controller: "DetailsConstantsController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsConstants", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.details").controller("DetailsImageController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                property: "=",
                data: "=",
                compact: "="
            },
            templateUrl: "scripts/details/details-image-partial.html",
            bindToController: !0,
            controller: "DetailsImageController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsImage", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.details").controller("DetailsIntegerController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                property: "=",
                data: "=",
                compact: "="
            },
            templateUrl: "scripts/details/details-integer-partial.html",
            bindToController: !0,
            controller: "DetailsIntegerController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsInteger", a)
}(),
function() {
    "use strict";
    function a() {
        var a = this;
        a.maxDataColumns = 4
    }
    angular.module("driver.details").controller("DetailsMultipleController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                data: "=",
                properties: "=",
                record: "=",
                recordSchema: "=",
                definition: "=",
                isSecondary: "<"
            },
            templateUrl: "scripts/details/details-multiple-partial.html",
            bindToController: !0,
            controller: "DetailsMultipleController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsMultiple", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.details").controller("DetailsNumberController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                property: "=",
                data: "=",
                compact: "="
            },
            templateUrl: "scripts/details/details-number-partial.html",
            bindToController: !0,
            controller: "DetailsNumberController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsNumber", a)
}(),
function() {
    "use strict";
    function a() {
        var a = this;
        if (a.record) {
            var b = _(a.record.data).toArray().filter(function(a) {
                return Array.isArray(a) && a.length > 0
            }).map(function(b) {
                return _.findIndex(b, {
                    _localId: a.data
                })
            }).value()
              , c = _.max(b);
            if (c > -1) {
                var d = a.property.watch.target
                  , e = a.recordSchema.schema.definitions[d].title;
                a.referenceDisplay = e + " " + (c + 1)
            }
        }
    }
    angular.module("driver.details").controller("DetailsReferenceController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                data: "=",
                property: "=",
                record: "=",
                recordSchema: "=",
                compact: "="
            },
            templateUrl: "scripts/details/details-reference-partial.html",
            bindToController: !0,
            controller: "DetailsReferenceController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsReference", a)
}(),
function() {
    "use strict";
    function a() {
        function a() {
            Array.isArray(b.data) && (b.data = b.data.join("; "))
        }
        var b = this;
        a()
    }
    angular.module("driver.details").controller("DetailsSelectlistController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                property: "=",
                data: "=",
                compact: "=",
                record: "<",
                isSecondary: "<"
            },
            templateUrl: "scripts/details/details-selectlist-partial.html",
            bindToController: !0,
            controller: "DetailsSelectlistController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsSelectlist", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.details").controller("DetailsSingleController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                data: "<",
                properties: "<",
                record: "<",
                recordSchema: "<",
                definition: "<",
                isSecondary: "<"
            },
            templateUrl: "scripts/details/details-single-partial.html",
            bindToController: !0,
            controller: "DetailsSingleController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsSingle", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d) {
        function e() {
            h.userCanWrite && (c.pendingRecordRequest = b.defer(),
            a.get({
                id: h.record.uuid,
                timeout: c.pendingRecordRequest.promise
            }).$promise.then(function(a) {
                h.record = a,
                h.sortedDefinitions = _.map(h.sortedDefinitions, function(a) {
                    return a.pending = !1,
                    a
                })
            }))
        }
        function f() {
            var a = _(h.recordSchema.schema.properties).sortBy(function(a, b) {
                return a.propertyName = b,
                void 0 !== a.propertyOrder ? a.propertyOrder : 99
            }).map(function(a) {
                return a.propertyName
            }).value()
              , b = _.map(a, function(a) {
                var b = h.recordSchema.schema.definitions[a];
                return b.propertyName = b.title,
                b.propertyKey = a,
                b.pending = !b.details && h.userCanWrite,
                b
            });
            return e(),
            b
        }
        function g(a) {
            return _(a).omit("_localId").map(function(a, b) {
                return a.propertyName = b,
                a
            }).sortBy("propertyOrder").value()
        }
        var h = this;
        h.sortedDefinitions = f(),
        h.sortedProperties = g,
        d.$on("$destroy", function() {
            c.pendingRecordRequest && c.pendingRecordRequest.resolve()
        })
    }
    a.$inject = ["Records", "$q", "$rootScope", "$scope"],
    angular.module("driver.details").controller("DetailsTabsController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                recordSchema: "=",
                record: "=",
                userCanWrite: "=",
                isSecondary: "<"
            },
            templateUrl: "scripts/details/details-tabs-partial.html",
            bindToController: !0,
            controller: "DetailsTabsController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsTabs", a)
}(),
function() {
    "use strict";
    function a(a) {
        var b = this;
        b.maxLength = 20,
        b.xShift = function() {
            return a.isRightToLeft ? b.compact ? 175 : 100 : 0
        }
    }
    a.$inject = ["$rootScope"],
    angular.module("driver.details").controller("DetailsTextController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                property: "=",
                data: "=",
                compact: "="
            },
            templateUrl: "scripts/details/details-text-partial.html",
            bindToController: !0,
            controller: "DetailsTextController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.details").directive("driverDetailsText", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("account", {
            url: "/account",
            label: "NAV.ACCOUNT",
            templateUrl: "scripts/views/account/account-partial.html",
            controller: "AccountController",
            showInNavbar: !1,
            resolve: {
                UserInfo: ["$log", "AuthService", "UserService", function(a, b, c) {
                    return c.getUser(b.getUserId())
                }
                ]
            }
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("driver.views.account", ["ui.router", "ui.bootstrap", "ase.auth", "ase.userdata"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        a.userInfo = c,
        a.userInfo && (a.userInfo.token = b.getToken())
    }
    a.$inject = ["$scope", "AuthService", "UserInfo"],
    angular.module("driver.views.account").controller("AccountController", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("login", {
            url: "/login",
            templateUrl: "scripts/views/login/login-partial.html",
            controller: "AuthController",
            resolve: {
                SSOClients: ["$log", "$http", "$q", "WebConfig", function(a, b, c, d) {
                    var e = c.defer();
                    return b.get(d.api.hostname + "/openid/clientlist/", {
                        cache: !0
                    }).success(function(b) {
                        b && b.clients ? e.resolve(b.clients) : (a.error("unexpected result for sso client list:"),
                        a.error(b),
                        e.resolve({}))
                    }).error(function(b, c) {
                        a.error("Failed to fetch SSO client list:"),
                        a.error(c),
                        a.error(b),
                        e.resolve({})
                    }),
                    e.promise
                }
                ]
            },
            params: {
                next: void 0,
                nextParams: void 0
            }
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("driver.views.login", ["ui.router", "ase.auth"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h) {
        a.auth = {},
        a.ssoClients = g,
        a.alerts = [],
        a.addAlert = function(b) {
            a.alerts.push(b)
        }
        ,
        a.closeAlert = function(b) {
            a.alerts.splice(b, 1)
        }
        ,
        a.authenticate = function() {
            a.alerts = [],
            a.authenticated = f.authenticate(a.auth),
            a.authenticated.then(function(a) {
                if (a.isAuthenticated) {
                    if (c.next && c.next.name !== b.name && !_.contains(["/", "/login"], c.next.url))
                        return b.go(c.next.name, c.nextParams).then(function() {
                            e.location.reload()
                        });
                    e.location.href = "/"
                } else
                    i(a)
            })["catch"](i)
        }
        ,
        a.sso = function(a) {
            var params={
                redirect_uri:encodeURI(h.api.hostname+"/oidc/callback/"),
                response_type:"code",
                client_id: h.OAUTH_CLIENT_ID,
                scope: "openid",
                flowName:"GeneralOAuthFlow"
            };
            e.location.href = "/oidc/authenticate/"
        }
        ;
        var i = function(b) {
            a.auth.failure = !0;
            var c = b.error || b.status + ": " + d.instant("ERRORS.UNKNOWN_ERROR") + ".";
            a.addAlert({
                type: "danger",
                msg: c
            })
        }
    }
    a.$inject = ["$scope", "$state", "$stateParams", "$translate", "$window", "AuthService", "SSOClients", "WebConfig"],
    angular.module("driver.views.login").controller("AuthController", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("dashboard", {
            url: "/",
            template: "<driver-dashboard></driver-dashboard>",
            label: "NAV.DASHBOARD",
            showInNavbar: !0
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("driver.views.dashboard", ["ui.router", "ui.bootstrap", "ase.resources", "driver.resources", "driver.toddow", "driver.stepwise", "driver.map-layers.recent-events", "driver.recentCounts", "driver.socialCosts", "driver.blackSpots", "driver.savedFilters", "driver.state"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i, j) {
        function k() {
            h.getSelected().then(function(a) {
                o.recordType = a
            }).then(l).then(m).then(n),
            a.$on("driver.state.recordstate:selected", function(a, b) {
                o.recordType = b,
                m()
            }),
            a.$on("driver.state.boundarystate:selected", function() {
                m()
            }),
            a.$on("driver.savedFilters:filterSelected", function(a, e) {
                b.go("map"),
                c(function() {
                    d.restoreFilters(e)
                }, 2e3)
            })
        }
        function l() {
            var a = o.recordType.current_schema;
            return g.get(a).then(function(a) {
                o.recordSchema = a
            })
        }
        function m() {
            var a = new Date
              , b = moment.duration({
                days: 90
            })
              , c = a.toISOString()
              , d = new Date(a - b).toISOString()
              , e = {
                occurred_min: d,
                occurred_max: c
            }
              , f = {
                doAttrFilters: !1,
                doBoundaryFilter: !0,
                doJsonFilters: !1
            };
            i.toddow(e, f).then(function(a) {
                o.toddow = a
            }),
            i.socialCosts(e, f).then(function(a) {
                o.socialCosts = a
            }, function(a) {
                o.socialCosts = a
            }),
            o.showBlackSpots || i.stepwise(e).then(function(b) {
                o.minDate = d,
                o.maxDate = a,
                o.stepwise = b
            })
        }
        function n() {
            var a = _.filter(o.recordSchema.schema.definitions, "details");
            o.propertiesKey = a[0].properties,
            o.headerKeys = _.without(_.keys(o.propertiesKey), "_localId")
        }
        var o = this;
        o.showBlackSpots = j.blackSpots.visible,
        e.ready().then(k)
    }
    a.$inject = ["$scope", "$state", "$timeout", "FilterState", "InitialState", "Records", "RecordSchemaState", "RecordState", "RecordAggregates", "WebConfig"],
    angular.module("driver.views.dashboard").controller("DashboardController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/views/dashboard/dashboard-partial.html",
            controller: "DashboardController",
            controllerAs: "ctl",
            bindToController: !0
        };
        return a
    }
    angular.module("driver.views.dashboard").directive("driverDashboard", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("duplicates", {
            url: "/duplicates",
            template: "<driver-duplicates-list></driver-duplicates-list>",
            label: "NAV.DUPLICATES",
            showInNavbar: !1
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("driver.views.duplicates", ["ngSanitize", "ase.auth", "driver.config", "driver.localization", "driver.resources", "driver.state", "ui.bootstrap", "ui.router"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i, j) {
        function k() {
            r.userCanWrite = e.hasWriteAccess(),
            i.getSelected().then(function(a) {
                r.recordType = a
            }).then(l).then(m)
        }
        function l() {
            var a = r.recordType.current_schema;
            return j.get(a).then(function(a) {
                r.recordSchema = a
            })
        }
        function m(a) {
            var b;
            return b = a ? r.currentOffset + a : 0 === a ? 0 : r.currentOffset,
            h.query({
                record_type: r.recordType.uuid,
                limit: r.numDuplicatesPerPage,
                offset: b
            }).$promise.then(function(a) {
                r.duplicates = a,
                r.currentOffset = b,
                n()
            })
        }
        function n() {
            var a = _.filter(r.recordSchema.schema.definitions, function(a, b) {
                return b.indexOf("Details") > -1 ? (r.detailsPropertyKey = b,
                a) : void 0
            });
            return 1 !== a.length ? void b.error("Expected one details definition, found " + a.length) : void (r.headerKeys = _(a[0].properties).omit("_localId").map(function(a, b) {
                return a.propertyName = b,
                a
            }).sortBy("propertyOrder").value())
        }
        function o() {
            m(-r.numDuplicatesPerPage)
        }
        function p() {
            m(r.numDuplicatesPerPage)
        }
        function q(a) {
            c.open({
                templateUrl: "scripts/views/duplicates/resolve-duplicate-modal-partial.html",
                controller: "ResolveDuplicateModalController as modal",
                size: "lg",
                resolve: {
                    params: function() {
                        return {
                            duplicate: a,
                            recordType: r.recordType,
                            recordSchema: r.recordSchema,
                            properties: r.headerKeys,
                            propertyKey: r.detailsPropertyKey
                        }
                    }
                }
            }).result.then(function() {
                m()
            })
        }
        var r = this;
        r.currentOffset = 0,
        r.numDuplicatesPerPage = g.record.limit,
        r.getPreviousDuplicates = o,
        r.getNextDuplicates = p,
        r.showResolveModal = q,
        r.userCanWrite = !1,
        f.ready().then(k)
    }
    a.$inject = ["$scope", "$log", "$modal", "$state", "AuthService", "InitialState", "WebConfig", "Duplicates", "RecordState", "RecordSchemaState"],
    angular.module("driver.views.duplicates").controller("DuplicatesListController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/views/duplicates/duplicates-list-partial.html",
            controller: "DuplicatesListController",
            controllerAs: "ctl",
            bindToController: !0
        };
        return a
    }
    angular.module("driver.views.duplicates").directive("driverDuplicatesList", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f() {
            return b.open({
                templateUrl: "scripts/views/duplicates/resolve-duplicate-confirmation-modal-partial.html",
                size: "sm",
                backdrop: "static",
                windowClass: "confirmation-modal"
            })
        }
        function g(a) {
            return f().result.then(function() {
                return c.resolve({
                    uuid: i.params.duplicate.uuid,
                    recordUUID: a
                }).$promise.then(function(a) {
                    i.close(a)
                })
            })
        }
        function h() {
            return c.resolve({
                uuid: i.params.duplicate.uuid
            }).$promise.then(function(a) {
                i.close(a)
            })
        }
        var i = this;
        i.params = e,
        i.selectRecord = g,
        i.keepBoth = h,
        i.close = a.close,
        i.dismiss = a.dismiss
    }
    a.$inject = ["$modalInstance", "$modal", "Duplicates", "Records", "params"],
    angular.module("driver.views.duplicates").controller("ResolveDuplicateModalController", a)
}(),
function() {
    "use strict";
    angular.module("driver.map-layers", ["driver.config"])
}(),
function() {
    "use strict";
    function a(a) {
        function b(a, b) {
            return b ? a.replace(/ALL/, b) : a
        }
        function c(a) {
            return b(j, a)
        }
        function d(a) {
            return b(k, a)
        }
        function e(a) {
            return b(l, a)
        }
        function f(a) {
            return b(n, a)
        }
        function g(a) {
            return b(m, a)
        }
        function h(a) {
            return b(o, a)
        }
        function i(a) {
            return b(p, a)
        }
        var j = a.windshaft.hostname + "/tiles/table/grout_record/id/ALL/{z}/{x}/{y}.png"
          , k = j + "?secondary=true"
          , l = a.windshaft.hostname + "/tiles/table/grout_record/id/ALL/{z}/{x}/{y}.grid.json"
          , m = a.windshaft.hostname + "/tiles/table/grout_boundary/id/ALL/{z}/{x}/{y}.png"
          , n = j + "?heatmap=true"
          , o = a.windshaft.hostname + "/tiles/table/black_spots_blackspot/id/ALL/{z}/{x}/{y}.png"
          , p = a.windshaft.hostname + "/tiles/table/black_spots_blackspot/id/ALL/{z}/{x}/{y}.grid.json"
          , q = {
            recTilesUrl: c,
            secondaryTilesUrl: d,
            recUtfGridTilesUrl: e,
            recHeatmapUrl: f,
            boundaryTilesUrl: g,
            blackspotsUrl: h,
            blackspotsUtfGridUrl: i
        };
        return q
    }
    a.$inject = ["WebConfig"],
    angular.module("driver.map-layers").factory("TileUrlService", a)
}(),
function() {
    "use strict";
    function a(a) {
        function b() {
            var b = new L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",{
                attribution: a.instant("MAP.CDB_ATTRIBUTION"),
                detectRetina: !1,
                zIndex: 1
            });
            return b
        }
        function c() {
            var b = new L.tileLayer("//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{
                attribution: a.instant("MAP.ESRI_ATTRIBUTION"),
                detectRetina: !1,
                zIndex: 1
            });
            return b
        }
        function d() {
            return [{
                slugLabel: "streets",
                label: a.instant("MAP.STREETS"),
                layer: b()
            }, {
                slugLabel: "satellite",
                label: a.instant("MAP.SATELLITE"),
                layer: c()
            }]
        }
        var e = {
            streets: b,
            satellite: c,
            baseLayers: d
        };
        return e
    }
    a.$inject = ["$translate"],
    angular.module("driver.map-layers").factory("BaseLayersService", a)
}(),
function() {
    "use strict";
    angular.module("driver.map-layers.recent-events", ["Leaflet", "driver.config", "driver.state", "driver.map-layers", "driver.resources"])
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g) {
        function h(d, e, f, g) {
            c.ready().then(function() {
                var c = g[0];
                c.getMap().then(i).then(j),
                a.all([c.getMap(), b.getSelected()]).then(function(a) {
                    var b = a[0]
                      , c = a[1];
                    c.bbox && b.fitBounds(c.bbox)
                }),
                d.$on("driver.state.boundarystate:selected", function() {
                    c.getMap().then(j)
                }),
                d.$on("driver.state.recordstate:selected", function() {
                    c.getMap().then(j)
                })
            })
        }
        function i(a) {
            var b = g.baseLayers();
            return a.addLayer(b[0].layer),
            n || (n = L.control.layers(_.zipObject(_.map(b, "label"), _.map(b, "layer"))),
            n.addTo(a)),
            a
        }
        function j(a) {
            var b = angular.extend(k, {
                zIndex: 3
            })
              , c = new Date;
            c.setDate(c.getDate() - l),
            d.getSelected().then(function(a) {
                var b = f.recTilesUrl(a.uuid)
                  , d = {
                    tilekey: !0,
                    occurred_min: c.toISOString()
                }
                  , g = {
                    doAttrFilters: !1,
                    doBoundaryFilter: !0,
                    doJsonFilters: !1
                };
                return e.djangoQuery(0, d, g).then(function(a) {
                    var c = (b.match(/\?/) ? "&" : "?") + "tilekey=";
                    return b + c + a.tilekey
                })
            }).then(function(c) {
                m && angular.forEach(m, function(b) {
                    a.removeLayer(b)
                });
                var d = new L.tileLayer(c,b);
                m = {
                    "Recent records": d
                },
                a.addLayer(d)
            })
        }
        var k = {
            attribution: "PRS",
            detectRetina: !0
        }
          , l = 14
          , m = null
          , n = null
          , o = {
            restrict: "A",
            scope: !1,
            replace: !1,
            controller: "",
            require: ["leafletMap"],
            link: h
        };
        return o
    }
    a.$inject = ["$q", "BoundaryState", "InitialState", "RecordState", "QueryBuilder", "TileUrlService", "BaseLayersService"],
    angular.module("driver.map-layers.recent-events").directive("recentEvents", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("map", {
            url: "/map",
            template: "<driver-map></driver-map>",
            label: "NAV.MAP",
            showInNavbar: !0
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("driver.views.map", ["ase.auth", "ui.router", "ui.bootstrap", "Leaflet", "driver.tools.charts", "driver.tools.export", "driver.tools.interventions", "driver.tools.enforcers", "driver.customReports", "driver.enforcers", "driver.config", "driver.localization", "driver.map-layers", "driver.state"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
        function o() {
            q.userCanWrite = d.hasWriteAccess(),
            k.getSelected().then(function(a) {
                q.recordType = a
            }).then(p),
            b.$on("driver.state.recordstate:selected", function(a, b) {
                q.recordType = b,
                p()
            }),
            a.$on("driver.filterbar:changed", function() {
                p()
            }),
            b.$on("driver.state.boundarystate:selected", function() {
                p()
            })
        }
        function p() {
            var a = {}
              , b = m.getFilterGeoJSON();
            b && (a.polygon = b),
            q.recordQueryParams = a,
            n.stepwise(a).then(function(a) {
                q.minDate = null,
                q.maxDate = null,
                h.filters.hasOwnProperty("__dateRange") && (h.filters.__dateRange.hasOwnProperty("min") && (q.minDate = h.filters.__dateRange.min),
                h.filters.__dateRange.hasOwnProperty("max") && (q.maxDate = h.filters.__dateRange.max)),
                q.stepwise = a
            }),
            n.toddow(a).then(function(a) {
                q.toddow = a
            }),
            n.socialCosts(a).then(function(a) {
                q.socialCosts = a
            }, function(a) {
                q.socialCosts = a
            })
        }
        var q = this;
        q.userCanWrite = !1,
        q.showInterventions = f.interventions.visible,
        q.showBlackSpots = f.blackSpots.visible,
        b.showDetailsModal = function(a) {
            j.query({
                record: a
            }).$promise.then(function(b) {
                var d = b[0];
                l.get(d.current_schema).then(function(b) {
                    c.open({
                        templateUrl: "scripts/views/record/details-modal-partial.html",
                        controller: "RecordDetailsModalController as modal",
                        size: "lg",
                        resolve: {
                            record: function() {
                                return i.get({
                                    id: a,
                                    details_only: "True"
                                }).$promise
                            },
                            recordType: function() {
                                return d
                            },
                            recordSchema: function() {
                                return b
                            },
                            userCanWrite: function() {
                                return q.userCanWrite
                            }
                        }
                    })
                })
            })
        }
        ,
        g.ready().then(o)
    }
    a.$inject = ["$rootScope", "$scope", "$modal", "AuthService", "BoundaryState", "WebConfig", "InitialState", "FilterState", "Records", "RecordTypes", "RecordState", "RecordSchemaState", "MapState", "RecordAggregates"],
    angular.module("driver.views.map").controller("MapController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/views/map/map-partial.html",
            controller: "MapController",
            controllerAs: "ctl",
            bindToController: !0
        };
        return a
    }
    angular.module("driver.views.map").directive("driverMap", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v) {
        function w() {
            R.editLayers.clearLayers(),
            q.setFilterGeoJSON(null)
        }
        function x(a) {
            w(),
            a.setStyle(aa),
            R.editLayers.addLayer(a),
            e.$broadcast("driver.views.map:filterdrawn"),
            q.setFilterGeoJSON(O(R.editLayers)),
            R.map.fitBounds(a.getBounds());
            var b = O(R.editLayers);
            e.$broadcast("driver.views.map:filterdrawn", b)
        }
        function y() {
            var a = O(R.editLayers);
            return a ? u.query({
                /*effective_at: k.getDateFilter().maxDate,*/
                record_type: R.recordType.uuid,
                polygon: a
            }).$promise : u.query({
                /*effective_at: k.getDateFilter().maxDate,*/
                record_type: R.recordType.uuid
            }).$promise
        }
        function z(a) {
            var b = {
                primaryRecordsUrl: r.recTilesUrl(R.recordType.uuid),
                primaryUtfGridUrl: r.recUtfGridTilesUrl(R.recordType.uuid),
                primaryHeatmapUrl: r.recHeatmapUrl(R.recordType.uuid),
                blackspotsUrl: "",
                blackspotsUtfGridUrl: "",
                blackspotTileKey: !1,
                secondaryRecordsUrl: "",
                secondaryUtfGridUrl: ""
            };
            if (a && a[0] && a[0].tilekey) {
                var c = a[0];
                c.tilekey && (b.blackspotsUrl = r.blackspotsUrl(c.tilekey),
                b.blackspotsUtfGridUrl = r.blackspotsUtfGridUrl(c.tilekey),
                b.blackspotTileKey = !0)
            } else if (a && a[0] && a[0].uuid) {
                var d = a[0].uuid;
                b.blackspotsUrl = r.blackspotsUrl(d),
                b.blackspotsUtfGridUrl = r.blackspotsUtfGridUrl(d)
            }
            return R.secondaryType && (b.secondaryRecordsUrl = r.secondaryTilesUrl(R.secondaryType.uuid),
            b.secondaryUtfGridUrl = r.recUtfGridTilesUrl(R.secondaryType.uuid)),
            b
        }
        function A(a) {
            var b = z(a);
            j.blackSpots.visible && H(b.blackspotsUrl, b.blackspotsUtfGridUrl, b.blackspotTileKey),
            E(b.secondaryRecordsUrl, b.secondaryUtfGridUrl),
            D(b.primaryRecordsUrl, b.primaryUtfGridUrl),
            j.heatmap.visible && G(b.primaryHeatmapUrl)
        }
        function B() {
            return R.boundariesLayerGroup ? a.when() : m.getOptions().then(function(a) {
                var b = angular.extend(ba, {
                    zIndex: 2
                })
                  , c = a.map(function(a) {
                    var c = r.boundaryTilesUrl(a.uuid) + "?color=" + encodeURIComponent(a.color.toLowerCase())
                      , d = new L.tileLayer(c,b);
                    return [a.label, d]
                });
                return R.boundariesLayerGroup = _.zipObject(c),
                R.boundariesLayerGroup
            })
        }
        function C() {
            var a = [[R.recordType.plural_label, R.primaryLayerGroup]];
            R.secondaryType && a.push([R.secondaryType.plural_label, R.secondaryLayerGroup]),
            j.heatmap.visible && a.push([g.instant("MAP.HEATMAP"), R.heatmapLayerGroup]),
            j.blackSpots.visible && a.push([g.instant("MAP.BLACKSPOTS"), R.blackspotLayerGroup]);
            var b = angular.extend(_.zipObject(a), R.boundariesLayerGroup);
            R.bMaps.then(function(a) {
                R.layerSwitcher || (R.layerSwitcher = L.control.layers(_.zipObject(_.map(a, "label"), _.map(a, "layer")), b, {
                    autoZIndex: !1
                }),
                R.layerSwitcher.addTo(R.map))
            })
        }
        function D(a, b) {
            var c = angular.extend(ba, {
                zIndex: 5
            })
              , d = new L.tileLayer(R.getFilterQuery(a, R.tilekey),c)
              , e = new L.UtfGrid(R.getFilterQuery(b, R.tilekey),{
                useJsonP: !1,
                zIndex: 7
            });
            F(e, {
                label: R.recordType.label
            }),
            R.primaryLayerGroup ? (_.forEach(R.primaryLayerGroup._layers, function(a) {
                "function" == typeof a.off && a.off("click"),
                R.primaryLayerGroup.removeLayer(a)
            }),
            R.primaryLayerGroup.addLayer(d),
            R.primaryLayerGroup.addLayer(e)) : (R.primaryLayerGroup = new L.layerGroup([d, e]),
            R.map.addLayer(R.primaryLayerGroup))
        }
        function E(a, b) {
            if (!R.secondaryType)
                return void (R.secondaryLayerGroup = null);
            var c = angular.extend(ba, {
                zIndex: 9
            })
              , d = new L.tileLayer(R.getFilterQuery(a, R.secondaryTilekey),c)
              , e = new L.UtfGrid(R.getFilterQuery(b, R.secondaryTilekey),{
                useJsonP: !1,
                zIndex: 11
            })
              , f = {};
            R.secondaryType && (f = {
                label: R.secondaryType.label
            }),
            F(e, f),
            R.secondaryLayerGroup ? (_.forEach(R.secondaryLayerGroup._layers, function(a) {
                "function" == typeof a.off && a.off("click"),
                R.secondaryLayerGroup.removeLayer(a)
            }),
            R.secondaryLayerGroup.addLayer(d),
            R.secondaryLayerGroup.addLayer(e)) : R.secondaryLayerGroup = new L.layerGroup([d, e])
        }
        function F(a, b) {
            a.on("click", function(a) {
                if (a.data) {
                    var c = {
                        maxWidth: 400,
                        maxHeight: 300,
                        autoPan: !0,
                        closeButton: !0,
                        autoPanPadding: [5, 5]
                    };
                    new L.popup(c).setLatLng(a.latlng).setContent(R.buildRecordPopup(a.data, b, a.latlng)).openOn(R.map),
                    h($("#record-popup"))(d)
                }
            })
        }
        function G(a) {
            var b = angular.extend(ba, {
                zIndex: 6
            })
              , c = new L.tileLayer(R.getFilterQuery(a, R.tilekey),b);
            if (R.heatmapLayerGroup) {
                for (var d in R.heatmapLayerGroup._layers)
                    R.heatmapLayerGroup.removeLayer(d);
                R.heatmapLayerGroup.addLayer(c)
            } else
                R.heatmapLayerGroup = new L.layerGroup([c])
        }
        function H(a, b, c) {
            var d = angular.extend(ba, {
                zIndex: 3
            });
            if (R.blackspotLayerGroup ? _.forEach(R.blackspotLayerGroup._layers, function(a) {
                "function" == typeof a.off && a.off("click"),
                R.blackspotLayerGroup.removeLayer(a)
            }) : R.blackspotLayerGroup = new L.layerGroup([]),
            a && c ? R.blackspotLayerGroup.addLayer(new L.tileLayer(I(a, c),d)) : a && R.blackspotLayerGroup.addLayer(new L.tileLayer(a,d)),
            b) {
                var e = new L.UtfGrid(I(b, c),{
                    useJsonP: !1,
                    zIndex: 4
                });
                J(e),
                R.blackspotLayerGroup.addLayer(e)
            }
        }
        function I(a, b) {
            var c = a;
            return b ? (c += (c.match(/\?/) ? "&" : "?") + "tilekey=",
            c += b) : c
        }
        function J(a) {
            a.on("click", function(a) {
                if (a.data) {
                    var b = {
                        maxWidth: 400,
                        maxHeight: 300,
                        autoPan: !0,
                        closeButton: !0,
                        autoPanPadding: [5, 5]
                    };
                    new L.popup(b).setLatLng(a.latlng).setContent(R.buildBlackspotPopup(a.data, a.latlng)).openOn(R.map),
                    h($("#blackspot-popup"))(d)
                }
            })
        }
        function K() {
            return '<img id="mapillaryimg" /><p id="mapillaryattributionp" align="right">Image powered by <a target="_blank" href="https://www.mapillary.com/">Mapillary</a>.</p>'
        }
        function M(a) {
            var b = j.mapillary.clientId
              , d = j.mapillary.range;
            v.get("https://a.mapillary.com/v3/images?closeto=" + a.lng + "," + a.lat + "&radius=" + d + "&client_id=" + b, {
                cache: !0
            }).success(function(a) {
                if (0 !== a.features.length) {
                    var b = document.querySelector("#mapillaryimg")
                      , c = document.querySelector("#mapillaryattributionp");
                    b.setAttribute("src", "https://d1cuyjsrcm0gby.cloudfront.net/" + a.features[0].properties.key + "/thumb-320.jpg"),
                    c.style.display = "block"
                }
            }).error(function(a, b) {
                c.error("Failed to get Mapillary data:"),
                c.error(b),
                c.error(a)
            })
        }
        function N(a) {
            if (!a.features || !a.features.length)
                return null;
            var b = a.features[0];
            switch (b.geometry.type) {
            case "FeatureCollection":
                return N(b.geometry);
            case "Polygon":
                return b.geometry;
            default:
                return c.warn("Unexpected feature type: ", b.geometry.type),
                null
            }
        }
        function O(a) {
            if (!a)
                return null;
            var b = a.toGeoJSON();
            return b && b.features ? N(b) : null
        }
        function P() {
            var a = {
                tilekey: !0
            }
              , b = O(R.editLayers);
            return b && (a.polygon = b),
            a
        }
        function Q() {
            var b = p.djangoQuery(0, P(), {}, !1).then(function(a) {
                R.tilekey = a.tilekey
            })
              , c = a.resolve("");
            if (R.secondaryType) {
                var d = P();
                d.record_type = R.secondaryType.uuid,
                c = p.djangoQuery(0, d, {
                    doJsonFilters: !1
                }, !1).then(function(a) {
                    R.secondaryTilekey = a.tilekey
                })
            }
            return a.all([b, c])
        }
        var R = this
          , S = b("localizeRecordDate")
          , T = "numeric"
          , U = g.instant("MAP.BLACKSPOT")
          , V = g.instant("MAP.SEVERITY_SCORE")
          , W = g.instant("MAP.NUM_SEVERE")
          , X = g.instant("RECORD.DETAILS")
          , Y = g.instant("COMMON.VIEW")
          , Z = g.instant("COMMON.EDIT");
        R.recordType = {
            uuid: "ALL",
            label: g.instant("RECORD.RECORD"),
            plural_label: g.instant("RECORD.RECORDS")
        },
        R.layerSwitcher = null,
        R.drawControl = null,
        R.map = null,
        R.overlays = null,
        R.bMaps = null,
        R.editLayers = null,
        R.tilekey = null,
        R.userCanWrite = !1,
        R.primaryLayerGroup = null,
        R.secondaryLayerGroup = null,
        R.heatmapLayerGroup = null,
        R.blackspotLayerGroup = null,
        R.boundariesLayerGroup = null;
        var aa = {
            color: "#f357a1",
            fillColor: "#f357a1",
            fill: !0
        }
          , ba = {
            attribution: "PRS",
            detectRetina: !0
        };
        R.initLayers = function(a) {
            a.scrollWheelZoom.enable(),
            t.ready().then(function() {
                R.init(a)
            })
        }
        ,
        R.init = function(b) {
            R.map = b,
            R.userCanWrite = i.hasWriteAccess();
            var c = a.defer();
            R.bMaps = c.promise,
            l.getSelected().then(function(a) {
                a && a.uuid ? (R.recordType = a,
                n.getFilterables(a.current_schema).then(function(a) {
                    R.recordSchemaFilterables = a
                }),
                l.getSecondary().then(function(a) {
                    R.secondaryType = a
                })) : (R.recordSchemaFilterables = [],
                R.recordType = {
                    uuid: "ALL",
                    label: g.instant("RECORD.RECORD"),
                    plural_label: g.instant("RECORD.RECORDS")
                },
                R.secondaryType = null)
            }).then(function() {
                return o.getSelected().then(function(a) {
                    a && a.uuid && (R.boundaryId = a.uuid)
                })
            }).then(Q).then(function() {
                var a = s.baseLayers();
                c.resolve(a);
                var b = _.find(a, function(a) {
                    return a.slugLabel === q.getBaseLayerSlugLabel()
                });
                b = b || a[0],
                R.map.addLayer(b.layer),
                R.editLayers = new L.FeatureGroup,
                R.map.addLayer(R.editLayers),
                R.editLayers.on("click", function(a) {
                    R.map.fire("click", a)
                }),
                R.map.on("click", function() {
                    angular.element(".datepicker").hide()
                }),
                R.drawControl = new L.Control.Draw({
                    draw: {
                        circle: !1,
                        marker: !1,
                        polyline: !1,
                        polygon: {
                            allowIntersection: !1,
                            showArea: !0,
                            drawError: {
                                message: "<strong>Filter area cannot intersect itself.</strong>"
                            },
                            shapeOptions: {}
                        }
                    },
                    edit: {
                        featureGroup: R.editLayers
                    }
                }),
                R.map.addControl(R.drawControl),
                R.map.on("draw:created", function(a) {
                    x(a.layer)
                }),
                R.map.on("draw:edited", function(a) {
                    a.layers.eachLayer(function(a) {
                        x(a)
                    })
                }),
                R.map.on("draw:drawstart", function() {
                    w(),
                    e.$broadcast("driver.views.map:filterdrawn", null)
                }),
                R.map.on("draw:deleted", function() {
                    w(),
                    e.$broadcast("driver.views.map:filterdrawn", null)
                }),
                R.map.on("zoomend", function() {
                    q.setZoom(R.map.getZoom())
                }),
                R.map.on("moveend", function() {
                    q.setLocation(R.map.getCenter())
                }),
                R.map.on("baselayerchange", function(a) {
                    var b = s.baseLayers()
                      , c = _.find(b, function(b) {
                        return b.label === a.name
                    });
                    c = c || b[0],
                    q.setBaseLayerSlugLabel(c.slugLabel)
                }),
                f(k.restoreFilters, 1e3)
            }).then(function() {
                if (q.getLocation() && q.getZoom() ? R.map.setView(q.getLocation(), q.getZoom()) : o.getSelected().then(function(a) {
                    a && a.bbox && R.map.fitBounds(a.bbox)
                }),
                q.getFilterGeoJSON()) {
                    var a = L.geoJson(q.getFilterGeoJSON());
                    a.setStyle(aa),
                    R.editLayers.addLayer(a)
                }
            }),
            d.$on("driver.state.recordstate:selected", function(a, b) {
                b && b.uuid && R.recordType.uuid !== b.uuid && (R.recordType = b,
                n.getFilterables(b.current_schema).then(function(a) {
                    R.recordSchemaFilterables = a
                }),
                R.setRecordLayers())
            }),
            d.$on("driver.state.boundarystate:selected", function(a, b) {
                b && b.uuid !== R.boundaryId && (R.boundaryId = b.uuid,
                Q().then(function() {
                    R.setRecordLayers()
                }))
            })
        }
        ,
        R.setRecordLayers = function() {
            return R.map ? void (R.layerSwitcher ? y().then(A) : y().then(A).then(B).then(C)) : void c.error("Map controller has no map! Cannot add layers.")
        }
        ,
        R.buildBlackspotPopup = function(a, b) {
            var c = '<div id="blackspot-popup" class="blackspot-popup">';
            return c += "<div><h4>" + a.name + "</h4></div>",
            c += "<div><h6>" + V + ": " + a.severity_score + "</h6></div>",
            c += "<div><h6>" + R.recordType.plural_label + ": " + a.num_records + "</h6></div>",
            c += "<div><h6>" + W + ": " + a.num_severe + "</h6></div>",
            j.mapillary.enabled && (c += K(),
            M(b)),
            c
        }
        ,
        R.buildRecordPopup = function(a, b, c) {
            var d = S(moment.utc(a.occurred_from), T, !0)
              , e = '<div id="record-popup" class="record-popup">';
            return e += "<div><h5>" + b.label + " " + X + "</h5><h3>" + d + "</h3>",
            j.mapillary.enabled && (e += K(),
            M(c)),
            e += "<a ng-click=\"showDetailsModal('" + a.uuid + "')\">",
            e += '<span class="glyphicon glyphicon-log-in"></span> ' + Y + "</a>",
            R.userCanWrite && (e += '<a href="/#!/record/' + a.uuid + '/edit" target="_blank">',
            e += '<span class="glyphicon glyphicon-pencil"></span> ',
            e += Z + "</a>"),
            e += "</div></div>"
        }
        ,
        R.getFilterQuery = function(a, b) {
            var c = a;
            return b && (c += (c.match(/\?/) ? "&" : "?") + "tilekey=",
            c += b),
            c
        }
        ;
        var ca = e.$on("driver.filterbar:changed", function() {
            Q().then(function() {
                R.setRecordLayers()
            })
        });
        return d.$on("$destroy", ca),
        R
    }
    a.$inject = ["$q", "$filter", "$log", "$scope", "$rootScope", "$timeout", "$translate", "$compile", "AuthService", "WebConfig", "FilterState", "RecordState", "GeographyState", "RecordSchemaState", "BoundaryState", "QueryBuilder", "MapState", "TileUrlService", "BaseLayersService", "InitialState", "BlackspotSets", "$http"],
    angular.module("driver.views.map").controller("driverLayersController", a)
}(),
function() {
    "use strict";
    function a() {
        function a(a, b, c, d) {
            var e = d[0]
              , f = d[1];
            e.getMap().then(f.initLayers)
        }
        var b = {
            restrict: "A",
            scope: !1,
            replace: !1,
            controller: "driverLayersController",
            require: ["leafletMap", "driver-map-layers"],
            link: a
        };
        return b
    }
    angular.module("driver.views.map").directive("driverMapLayers", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.stepwise", ["driver.state", "driver.localization", "ui.router", "ui.bootstrap"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d) {
        var e = {
            restrict: "E",
            scope: {
                chartData: "<",
                minDate: "<",
                maxDate: "<",
                inDashboard: "<"
            },
            link: function(b, e) {
                function f() {
                    var a = c.getSelected().rtl
                      , d = d3.select(e[0]).append("svg").attr("width", "100%").attr("height", "100%");
                    $(window).resize("resize.doResize", function() {
                        g(d, e, b.chartData, a)
                    }),
                    b.$on("$destroy", function() {
                        $(window).off("resize.doResize")
                    }),
                    b.$watch("chartData", function(b) {
                        b && g(d, e, b, a)
                    })
                }
                function g(a, c, d, e) {
                    var f = q(d);
                    a.selectAll("*").remove();
                    var g = d3.select(c[0])[0][0]
                      , r = {
                        width: g.offsetWidth - 40,
                        height: g.offsetHeight - 15
                    };
                    b.inDashboard || (r.width = 535,
                    r.height = 185);
                    var s = {
                        container: {
                            x: b.inDashboard ? 45 : 25,
                            y: 15
                        },
                        xAxis: {
                            x: 5
                        },
                        yAxis: {
                            x: e ? 70 : 5,
                            y: -10
                        },
                        yAxisText: {
                            x: e ? 45 : 30,
                            y: 0
                        }
                    };
                    s.xAxis.y = r.height - s.container.y - 10;
                    var t;
                    t = e ? [r.width - s.yAxis.x, s.xAxis.x] : [s.xAxis.x, r.width - s.yAxis.x];
                    var u = {
                        tScale: d3.time.scale().range(t),
                        x: d3.scale.ordinal().rangeBands(t, .05),
                        y: d3.scale.linear().range([r.height, s.container.y - s.yAxis.y])
                    };
                    u.tScale.domain(f.tScale),
                    u.x.domain(f.x),
                    u.y.domain(f.y);
                    var v = h(u.tScale)
                      , w = i(u.y, d)
                      , x = j(a, s.container)
                      , y = k(x, r, s, e);
                    l(y, w, r, s, e);
                    var z = m(x, s.xAxis);
                    n(z, v, e);
                    var A = o();
                    x.call(A),
                    p(x, f, u, r, s, A)
                }
                function h(a) {
                    var b = d3.svg.axis().scale(a).tickFormat(function(a) {
                        return d.getLocalizedDateString(a, "short")
                    }).ticks(5).tickSize(1).orient("bottom");
                    return b
                }
                function i(a, b) {
                    var c = _.max(_.map(b, function(a) {
                        return a.count
                    }))
                      , d = d3.svg.axis().scale(a).orient("left").tickSize(1).ticks(Math.min(10, Math.max(2, c)));
                    return d
                }
                function j(a, b) {
                    var c = a.append("g").attr("class", "outer").attr("transform", "translate(" + b.x + "," + b.y + ")");
                    return c
                }
                function k(a, b, c, d) {
                    var e = c.yAxis
                      , f = c.container
                      , g = a.append("g").attr("class", "yAxis").attr("transform", "translate(" + (d ? b.width - e.x : e.x) + ", " + (e.y - f.y) + ")");
                    return g
                }
                function l(c, d, e, f, g) {
                    c.call(d).attr("x", -100).selectAll("text").attr("text-anchor", "right").attr("x", g ? 5 : -5).attr("dy", 0),
                    b.inDashboard && c.append("text").attr("text-anchor", "middle").attr("transform", "translate(" + (g ? f.yAxisText.x : -f.yAxisText.x) + "," + (e.height / 2 - 2 * f.yAxis.y) + ")rotate(-90)").text(a.instant("DASHBOARD.STEPWISE_TITLE"))
                }
                function m(a, b) {
                    var c = a.append("g").attr("class", "xAxis").attr("transform", "translate(0," + b.y + ")");
                    return c
                }
                function n(a, b, c) {
                    a.call(b).selectAll("text").attr("class", "label").style("text-anchor", "end").attr("dx", c ? "-2em" : "1.5em").attr("dy", "1em")
                }
                function o() {
                    var b = d3.tip().html(function(b) {
                        return "<strong>" + a.instant("RECORD.WEEK_OF") + ": </strong>" + d.getLocalizedDateString(b.dt, "long") + "</br><strong>" + a.instant("RECORD.EVENT_COUNT") + ":</strong> <span>" + b.count + "</span>"
                    }).offset([-20, -15]);
                    return b
                }
                function p(a, b, c, d, e, f) {
                    a.selectAll("bar").attr("class", "test").data(b.temporal).enter().append("rect").style("fill", "#337ab7").attr("data-date", function(a) {
                        return a.dt.toLocaleDateString()
                    }).attr("class", "bar").attr("x", function(a) {
                        return c.x(a.dt.toLocaleDateString())
                    }).attr("width", .8 * c.x.rangeBand()).attr("y", function(a) {
                        return c.y(a.count) - (d.height - e.xAxis.y)
                    }).attr("height", function(a) {
                        return d.height - c.y(a.count)
                    }).on("mouseover", f.show).on("mouseout", f.hide)
                }
                function q(a) {
                    var b = {};
                    b.moment = _.map(a, function(a) {
                        return {
                            dt: moment().year(a.year).week(a.week + 1),
                            count: a.count
                        }
                    });
                    var c = s(b.moment)
                      , d = _.max(a, function(a) {
                        return a.count
                    }).count || 10;
                    return b.tScale = [new Date(c[0]), new Date(c[c.length - 1])],
                    b.x = _.map(c, function(a) {
                        return a.toLocaleDateString()
                    }),
                    b.y = [0, d],
                    b.temporal = _.uniq(_.map(b.moment, function(a) {
                        return {
                            dt: r(a.dt.toDate()),
                            count: a.count
                        }
                    }).concat(_.map(c, function(a) {
                        return {
                            dt: r(a),
                            count: 0
                        }
                    })), function(a) {
                        return a.dt.toLocaleDateString()
                    }),
                    b
                }
                function r(a) {
                    return d3.time.week(new Date(a))
                }
                function s(a) {
                    var c, d, e = _.map(a, function(a) {
                        return a.dt
                    });
                    c = b.minDate ? moment(d3.time.week(new Date(b.minDate))) : moment.min(e),
                    d = b.maxDate ? moment(d3.time.week(new Date(b.maxDate))) : moment.max(e);
                    for (var f = [], g = d.unix(), h = c.clone(); h.unix() <= g; h = h.clone().add(1, "week"))
                        f.push(r(h.toDate()));
                    return f
                }
                a.onReady(f)
            }
        };
        return e
    }
    a.$inject = ["$translate", "$window", "LanguageState", "DateLocalization"],
    angular.module("driver.stepwise").directive("driverStepwise", a)
}(),
function() {
    "use strict";
    function a() {}
    angular.module("driver.toddow", ["driver.state", "ui.router", "ui.bootstrap"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b) {
        var c = ["#FDFBED", "#f6edb1", "#f7da22", "#ecbe1d", "#e77124", "#d54927", "#cf3a27", "#a33936", "#7f182a", "#68101a"]
          , d = {
            restrict: "E",
            scope: {
                chartData: "="
            },
            template: "<svg></svg>",
            link: function(d, e) {
                function f() {
                    var e = b.getSelected().rtl;
                    d.$watch("chartData", function(a) {
                        if (a) {
                            var b = i(a, e);
                            k = d3.scale.quantile().domain([0, _.max(a, function(a) {
                                return a.count
                            }).count]).range(c),
                            g(b)
                        }
                    }),
                    l = d3.select(m).attr("viewBox", "0 0 " + p + " " + o).attr("preserveAspectRatio", "xMinYMin").attr("fill", "grey"),
                    l.append("text").attr("transform", "translate(-6," + 3.5 * n + ")rotate(-90)").style("text-anchor", "middle").text(function(a) {
                        return a
                    });
                    var f = _.map(["DAY.SUN", "DAY.MON", "DAY.TUE", "DAY.WED", "DAY.THU", "DAY.FRI", "DAY.SAT"], function(b) {
                        return a.instant(b)
                    })
                      , r = _.range(24);
                    e && (r = _(r).reverse().value()),
                    j = l.selectAll(".day").data(f).enter().append("g").attr("class", "day").attr("data-day", function(a, b) {
                        return f[b]
                    }).selectAll(".hour").data(function(a, b) {
                        var c = d3.time.week(new Date("01/01/2001"));
                        return d3.time.hours(moment(c).add(b, "days").toDate(), moment(c).add(b + 1, "days").toDate())
                    }).enter().append("g").append("rect").attr("class", "hour").attr("fill", "white").attr("stroke", "white").attr("width", n).attr("height", n).attr("x", function(a, b) {
                        return n * b + (e ? 0 : 30)
                    }).attr("y", function(a, b, c) {
                        return c * n + 20
                    }),
                    l.selectAll(".day").append("text").text(function(a, b) {
                        return f[b]
                    }).attr("class", "label").attr("x", e ? 652 : 0).attr("y", function(a, b) {
                        return b * n + 40
                    }),
                    l.select(".day").selectAll("g").append("text").text(function(a, b) {
                        return r[b]
                    }).attr("class", "label hours").attr("x", function(a, b) {
                        return b * n + (e ? 17 : 37)
                    }).attr("y", 10),
                    j.attr("data-hour", function(a) {
                        h(a)
                    }).datum(h).on("mouseover", function(a) {
                        try {
                            q.show(a)
                        } catch (b) {}
                    }).on("mouseout", q.hide)
                }
                function g(b) {
                    l.call(q),
                    q.html(function(c) {
                        var d = b[c] || "0";
                        return a.instant("RECORD.EVENT_COUNT") + ": " + d
                    }),
                    j.attr("fill", "#f1f2f2"),
                    j.filter(function(a) {
                        return b.hasOwnProperty(a)
                    }).attr("fill", function(a) {
                        return k(b[a])
                    })
                }
                function h(a) {
                    return moment(a).format("H") + ":" + (+moment(a).format("e") + 1)
                }
                function i(a, b) {
                    var c = {};
                    return _.each(a, function(a) {
                        var d = b ? 23 - a.tod : a.tod;
                        c[d + ":" + a.dow] = a.count
                    }),
                    c
                }
                var j, k, l, m = e.find("svg")[0], n = 26, o = 210, p = 660, q = d3.tip();
                q.offset(function() {
                    return [-16, -18]
                }),
                a.onReady(f)
            }
        };
        return d
    }
    a.$inject = ["$translate", "LanguageState"],
    angular.module("driver.toddow").directive("driverToddow", a)
}(),
function() {
    "use strict";
    angular.module("driver.tools.charts", ["ui.bootstrap", "ui.router", "driver.stepwise", "driver.toddow"])
}(),
function() {
    "use strict";
    function a(a, b) {
        function c() {
            e.isOpen = !1,
            e.toggle = d
        }
        function d() {
            e.isOpen = !e.isOpen,
            e.isOpen && a.$broadcast("driver.tools.charts.open")
        }
        var e = this;
        c(),
        b.$on("driver.tools.export.open", function() {
            e.isOpen = !1
        }),
        b.$on("driver.tools.interventions.open", function() {
            e.isOpen = !1
        }),
        b.$on("driver.tools.costs.open", function() {
            e.isOpen = !1
        })
    }
    a.$inject = ["$rootScope", "$scope"],
    angular.module("driver.tools.charts").controller("ChartsController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            scope: {
                stepwise: "=",
                minDate: "=",
                maxDate: "=",
                toddow: "="
            },
            templateUrl: "scripts/tools/charts/charts-partial.html",
            bindToController: !0,
            controller: "ChartsController",
            controllerAs: "ctl"
        };
        return a
    }
    angular.module("driver.tools.charts").directive("driverCharts", a)
}(),
function() {
    "use strict";
    angular.module("driver.tools.export", ["ui.bootstrap", "ui.router", "driver.customReports", "driver.resources", "angular-spinkit"])
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f) {
        function g() {
            k.isOpen = !1,
            k.pending = !1,
            k.downloadURL = null,
            k.error = null,
            k.toggle = h,
            k.exportCSV = i,
            k.showCustomReportsModal = j
        }
        function h() {
            k.isOpen = !k.isOpen,
            k.isOpen && b.$broadcast("driver.tools.export.open")
        }
        function i() {
            d.cancelPolling(),
            k.error = null,
            k.downloadURL = null,
            k.pending = !0;
            var a = _.extend({
                tilekey: !0,
                limit: 0
            }, k.recordQueryParams);
            f.djangoQuery(0, a).then(function(a) {
                d.exportCSV(a.tilekey).promise.then(function(a) {
                    k.downloadURL = a
                }, function(a) {
                    k.error = a
                })["finally"](function() {
                    k.pending = !1
                })
            })
        }
        function j() {
            a.open({
                templateUrl: "scripts/custom-reports/custom-reports-modal-partial.html",
                controller: "CustomReportsModalController as modal"
            })
        }
        var k = this;
        e.ready().then(g),
        c.$on("driver.tools.charts.open", function() {
            k.isOpen = !1
        }),
        c.$on("driver.tools.interventions.open", function() {
            k.isOpen = !1
        }),
        c.$on("driver.tools.costs.open", function() {
            k.isOpen = !1
        }),
        c.$on("$destroy", d.cancelPolling)
    }
    a.$inject = ["$modal", "$rootScope", "$scope", "RecordExports", "InitialState", "QueryBuilder"],
    angular.module("driver.tools.export").controller("ExportController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            templateUrl: "scripts/tools/export/export-partial.html",
            controller: "ExportController",
            controllerAs: "ctl",
            bindToController: !0,
            scope: {
                recordQueryParams: "=params"
            }
        };
        return a
    }
    angular.module("driver.tools.export").directive("driverExport", a)
}(),
function() {
    "use strict";
    angular.module("driver.tools.interventions", ["ui.bootstrap", "ui.router", "driver.resources", "angular-spinkit"])
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f) {
        function g() {
            j.isOpen = !1,
            j.pending = !1,
            j.downloadURL = null,
            j.error = null,
            j.toggle = h,
            j.exportCSV = i,
            c.getSecondary().then(function(a) {
                j.recordType = a
            })
        }
        function h() {
            j.isOpen = !j.isOpen,
            j.isOpen && a.$broadcast("driver.tools.interventions.open")
        }
        function i() {
            f.cancelPolling(),
            j.error = null,
            j.downloadURL = null,
            j.pending = !0;
            var a = _.extend({
                tilekey: !0,
                record_type: j.recordType.uuid
            }, j.recordQueryParams);
            e.djangoQuery(0, a, {
                doJsonFilters: !1
            }, !0).then(function(a) {
                f.exportCSV(a.tilekey).promise.then(function(a) {
                    j.downloadURL = a
                }, function(a) {
                    j.error = a
                })["finally"](function() {
                    j.pending = !1
                })
            })
        }
        var j = this;
        d.ready().then(g),
        b.$on("driver.tools.charts.open", function() {
            j.isOpen = !1
        }),
        b.$on("driver.tools.export.open", function() {
            j.isOpen = !1
        }),
        b.$on("driver.tools.costs.open", function() {
            j.isOpen = !1
        }),
        b.$on("$destroy", f.cancelPolling)
    }
    a.$inject = ["$rootScope", "$scope", "RecordState", "InitialState", "QueryBuilder", "RecordExports"],
    angular.module("driver.tools.interventions").controller("InterventionsController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            templateUrl: "scripts/tools/interventions/interventions-partial.html",
            controller: "InterventionsController",
            controllerAs: "ctl",
            bindToController: !0,
            scope: {
                recordQueryParams: "=params"
            }
        };
        return a
    }
    angular.module("driver.tools.interventions").directive("driverInterventions", a)
}(),
function() {
    "use strict";
    angular.module("driver.tools.enforcers", ["ui.bootstrap", "ui.router", "driver.enforcers", "driver.resources", "angular-spinkit"])
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "AE",
            templateUrl: "scripts/tools/enforcers/enforcers-tool-partial.html",
            controller: "EnforcersToolController",
            controllerAs: "ctl",
            bindToController: !0,
            scope: {
                recordQueryParams: "=params"
            }
        };
        return a
    }
    angular.module("driver.tools.enforcers").directive("enforcersTool", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f() {
            h.showEnforcementModal = g
        }
        function g() {
            a.open({
                templateUrl: "scripts/enforcers/enforcers-modal-partial.html",
                controller: "EnforcersModalController as modal"
            })
        }
        var h = this;
        e.ready().then(f)
    }
    a.$inject = ["$modal", "$rootScope", "$scope", "RecordExports", "InitialState"],
    angular.module("driver.tools.enforcers").controller("EnforcersToolController", a)
}(),
function() {
    "use strict";
    angular.module("driver.weather", [])
}(),
function() {
    "use strict";
    function a() {
        return function(a) {
            return _.isString(a) ? "WEATHER." + (a ? a.toUpperCase().replace(/-/g, "_") : "EMPTY") : a
        }
    }
    angular.module("driver.weather").filter("weatherLabel", a)
}(),
function() {
    "use strict";
    function a() {
        return {
            lightValues: ["", "dawn", "day", "dusk", "night"],
            weatherValues: ["", "clear-day", "clear-night", "cloudy", "fog", "hail", "partly-cloudy-day", "partly-cloudy-night", "rain", "sleet", "snow", "thunderstorm", "tornado", "wind"]
        }
    }
    angular.module("driver.weather").factory("WeatherService", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("record", {
            "abstract": !0,
            url: "",
            template: "<ui-view></ui-view>"
        }),
        a.state("record.add", {
            url: "/add",
            template: "<driver-record-add-edit></driver-record-add-edit>",
            label: "NAV.ADD_A_RECORD",
            showInNavbar: !1
        }),
        a.state("record.addSecondary", {
            url: "/addsecondary",
            template: "<driver-record-add-edit></driver-record-add-edit>",
            label: "NAV.ADD_A_RECORD",
            showInNavbar: !1,
            secondary: !0
        }),
        a.state("record.list", {
            url: "/list",
            template: "<driver-record-list></driver-record-list>",
            label: "NAV.RECORD_LIST",
            showInNavbar: !0
        }),
        a.state("record.edit", {
            url: "/record/:recorduuid/edit",
            template: "<driver-record-add-edit></driver-record-add-edit>",
            label: "NAV.EDIT_A_RECORD",
            showInNavbar: !1
        }),
        a.state("record.details", {
            url: "/record/:recorduuid/details",
            template: "<driver-record-details></driver-record-details>",
            label: "NAV.RECORD_DETAILS",
            showInNavbar: !1
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("driver.views.record", ["ngSanitize", "ase.auth", "ase.notifications", "ase.resources", "ase.schemas", "datetimepicker", "driver.config", "driver.localization", "driver.map-layers", "driver.details", "Leaflet", "driver.resources", "driver.state", "driver.nominatim", "driver.weather", "json-editor", "ui.bootstrap", "ui.router", "uuid"]).config(a)
}(),
function() {
    "use strict";
    function a(a, c, d, e, f, g, h) {
        function i(a) {
            m ? (c.cancel(m),
            m = null) : m = c(function() {
                l(a.latlng),
                j(a.latlng),
                m = null
            }, 300)
        }
        function j(a) {
            n.locationMarker ? n.locationMarker.setLatLng(a) : (n.locationMarker = new L.marker(a,{
                draggable: n.isEditable
            }).addTo(n.map),
            n.isEditable && n.locationMarker.on("dragend", function() {
                l(n.locationMarker.getLatLng())
            }),
            n.map.setView(a, b, {
                animate: !0
            }))
        }
        function k(a) {
            e.$broadcast("driver.views.record:map-moved", [a.getWest(), a.getNorth(), a.getEast(), a.getSouth()])
        }
        function l(b) {
            return n.isEditable ? void e.$broadcast("driver.views.record:marker-moved", [b.lng, b.lat]) : void a.error("Attempting to broadcast marker coordinates on non-editable map")
        }
        var m = null
          , n = this;
        return n.isEditable = !1,
        n.map = null,
        n.locationMarker = null,
        n.setUpMap = function(a, b, c, d) {
            n.map = a,
            n.isEditable = !!b;
            var e = g.baseLayers();
            n.layerSwitcher || (n.layerSwitcher = L.control.layers(_.zipObject(_.map(e, "label"), _.map(e, "layer"))),
            n.layerSwitcher.addTo(n.map));
            var f = _.find(e, function(a) {
                return a.slugLabel === h.getBaseLayerSlugLabel()
            });
            f = f || e[0],
            n.map.addLayer(f.layer),
            n.isEditable && (n.map.on("click", i),
            n.map.on("moveend", function(a) {
                k(a.target.getBounds())
            })),
            c && d ? j(L.latLng(c, d)) : h.getLocation() && h.getZoom() && n.map.setView(h.getLocation(), h.getZoom() - 1)
        }
        ,
        e.$on("driver.views.record:location-selected", function(a, c, d) {
            if (n.map) {
                var e = L.latLng(c.lat, c.lng);
                j(e),
                d && n.map.setView(e, b, {
                    animate: !0
                })
            }
        }),
        d.$on("driver.views.record:close", function() {
            n.map = null,
            n.locationMarker = null
        }),
        n
    }
    var b = 17;
    a.$inject = ["$log", "$timeout", "$scope", "$rootScope", "TileUrlService", "BaseLayersService", "MapState"],
    angular.module("driver.views.record").controller("embedMapController", a)
}(),
function() {
    "use strict";
    function a() {
        function a(a, b, c, d) {
            var e = d[0]
              , f = d[1];
            e.getMap().then(function(a) {
                f.setUpMap(a, c.editable, c.lat, c.lng)
            })
        }
        var b = {
            restrict: "A",
            scope: !1,
            replace: !1,
            controller: "embedMapController",
            require: ["leafletMap", "driver-embed-map"],
            link: a
        };
        return b
    }
    angular.module("driver.views.record").directive("driverEmbedMap", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t) {
        function u() {
            O.combineOccurredFromDateAndTime = w,
            O.combineOccurredToDateAndTime = x,
            O.fixOccurredDTForPickers = z,
            O.goBack = K,
            O.onDataChange = I,
            O.onDeleteClicked = L,
            O.onSaveClicked = M,
            O.onGeomChanged = y,
            O.nominatimLookup = E,
            O.nominatimSelect = F,
            O.userCanWrite = j.hasWriteAccess(),
            O.isSecondary = c.current.secondary,
            O.nominatimLocationText = "",
            O.nominatimCity = "",
            O.nominatimCityDistrict = "",
            O.nominatimCounty = "",
            O.nominatimNeighborhood = "",
            O.nominatimRoad = "",
            O.nominatimState = "",
            O.constantFieldErrors = null,
            O.geom = {
                lat: null,
                lng: null
            },
            O.occurredFromDate = new Date,
            O.occurredToDate = new Date,
            O.occurredFromTime = new Date,
            O.occurredToTime = new Date,
            b.$on("driver.views.record:marker-moved", function(a, c) {
                b.$apply(function() {
                    O.geom.lat = c[1],
                    O.geom.lng = c[0]
                }),
                J()
            }),
            b.$on("driver.views.record:map-moved", function(a, b) {
                Q = b
            }),
            b.$watchCollection(function() {
                return O.geom
            }, function(a) {
                a && a.lat && a.lng && (O.nominatimLocationText && R ? R = !1 : l.reverse(a.lng, a.lat).then(function(a) {
                    O.nominatimLocationText = a.display_name,
                    O.nominatimCity = a.address.city,
                    O.nominatimCityDistrict = a.address.city_district,
                    O.nominatimCounty = a.address.county,
                    O.nominatimNeighborhood = a.address.neighbourhood,
                    O.nominatimRoad = a.address.road,
                    O.nominatimState = a.address.state
                }))
            });
            var a;
            d.recorduuid ? a = A().then(B) : (a = B(),
            O.occurredFrom = new Date,
            O.isSecondary && (O.occurredTo = O.occurredFrom)),
            a.then(function() {
                O.isSecondary || (O.lightValues = r.lightValues,
                O.weatherValues = r.weatherValues),
                h.onReady(G)
            }),
            b.$on("$destroy", function() {
                b.$emit("driver.views.record:close")
            })
        }
        function v() {
            O.occurredFromDate = new Date(O.occurredFrom),
            O.occurredFromTime = new Date(O.occurredFrom),
            O.occurredToDate = new Date(O.occurredTo),
            O.occurredToTime = new Date(O.occurredTo)
        }
        function w() {
            var a = O.occurredFromTime.getHours()
              , b = O.occurredFromTime.getMinutes()
              , c = new Date(O.occurredFromDate);
            c.setHours(a),
            c.setMinutes(b),
            O.occurredFrom = c,
            J()
        }
        function x() {
            var a = O.occurredToTime.getHours()
              , b = O.occurredToTime.getMinutes()
              , c = new Date(O.occurredToDate);
            c.setHours(a),
            c.setMinutes(b),
            O.occurredTo = c,
            J()
        }
        function y(a) {
            O.geom.lat && O.geom.lng && b.$emit("driver.views.record:location-selected", O.geom, a),
            J()
        }
        function z(a) {
            O.occurredFrom = t.convertNonTimezoneDate(O.occurredFrom, a),
            O.occurredTo && (O.occurredTo = t.convertNonTimezoneDate(O.occurredTo, a))
        }
        function A() {
            return n.get({
                id: d.recorduuid
            }).$promise.then(function(a) {
                O.record = a,
                O.occurredFrom = O.record.occurred_from,
                O.occurredTo = O.record.occurred_to,
                z(!1),
                v(),
                O.geom.lat = O.record.geom.coordinates[1],
                O.geom.lng = O.record.geom.coordinates[0],
                O.nominatimLocationText = O.record.location_text,
                O.nominatimCity = O.record.city,
                O.nominatimCityDistrict = O.record.city_district,
                O.nominatimCounty = O.record.county,
                O.nominatimNeighborhood = O.record.neighborhood,
                O.nominatimRoad = O.record.road,
                O.nominatimState = O.record.state,
                O.weather = O.record.weather,
                O.light = O.record.light,
                y(!1)
            })
        }
        function B() {
            var a;
            return a = O.record ? q.query({
                record: O.record.uuid
            }).$promise.then(function(a) {
                var b = a[0];
                return o.getSecondary().then(function(a) {
                    a && a.uuid === b.uuid && (O.isSecondary = !0)
                }),
                b
            }) : O.isSecondary ? o.getSecondary() : o.getSelected(),
            a.then(function(a) {
                return a ? (O.recordType = a,
                p.get(O.recordType.current_schema).then(function(a) {
                    O.recordSchema = a
                })) : (O.error = h.instant("ERRORS.RECORD_SCHEMA_LOAD"),
                f.reject(O.error))
            })
        }
        function C() {
            O.record && _.forEach(O.recordSchema.schema.definitions, function(a, b) {
                _.forEach(a.properties, function(c, d) {
                    O.record.data.hasOwnProperty(b) || (O.record.data[b] = null);
                    var e = O.record.data[b];
                    _.forEach(a.multiple ? e : [e], function(a) {
                        a && !a.hasOwnProperty(d) && (a[d] = null)
                    })
                })
            })
        }
        function D() {
            O.isSecondary && _.forEach(O.recordSchema.schema.definitions, function(a) {
                _.forEach(a.properties, function(a) {
                    if ("selectlist" === a.fieldType) {
                        var b = _.map(a["enum"], function(a) {
                            var b = h.instant("INTERVENTION_TYPE." + a);
                            return b.includes("INTERVENTION_TYPE.") ? a : b
                        });
                        a.options = {
                            enum_titles: b
                        }
                    }
                })
            })
        }
        function E(a) {
            return l.forward(a, Q)
        }
        function F(a) {
            R = !0,
            _.delay(function() {
                R = !1
            }, 500),
            O.geom.lat = parseFloat(a.lat),
            O.geom.lng = parseFloat(a.lon),
            y(!0)
        }
        function G() {
            C(),
            D(),
            k.addTranslation("button_add_row_title", h.instant("RECORD.BUTTON_ADD_ROW_TITLE")),
            k.addTranslation("button_collapse", h.instant("RECORD.BUTTON_COLLAPSE")),
            k.addTranslation("button_delete_row_title", h.instant("RECORD.BUTTON_DELETE_ROW_TITLE")),
            k.addTranslation("button_expand", h.instant("RECORD.BUTTON_EXPAND")),
            O.editor = {
                id: "new-record-editor",
                options: {
                    schema: O.recordSchema.schema,
                    disable_edit_json: !0,
                    disable_properties: !0,
                    disable_array_delete_all_rows: !0,
                    disable_array_delete_last_row: !0,
                    disable_array_reorder: !0,
                    collapsed: !0,
                    theme: "bootstrap3",
                    iconlib: "bootstrap3",
                    show_errors: "change",
                    no_additional_properties: !0,
                    startval: O.record ? O.record.data : null,
                    use_auto_inc_titles: !0
                },
                errors: []
            }
        }
        function H(a) {
            var b = !1;
            return _.each(a, function(c, d) {
                "_localId" !== d || c ? c instanceof Array ? _.each(c, function(a) {
                    b = b || H(a)
                }) : c instanceof Object && (b = b || H(c)) : (a._localId = i.generate(),
                b = !0)
            }),
            b
        }
        function I(a, b, c) {
            return H(a) ? void c.setValue(a) : (P = a,
            void (O.editor.errors = b))
        }
        function J() {
            var a = {
                latitude: O.geom.lat,
                longitude: O.geom.lng,
                occurred: O.occurredFrom
            };
            if (O.constantFieldErrors = {},
            angular.forEach(a, function(a, b) {
                a || (O.constantFieldErrors[b] = b + ": " + h.instant("ERRORS.VALUE_REQUIRED"))
            }),
            O.isSecondary && O.occurredFrom && O.occurredTo && O.occurredFrom > O.occurredTo && (O.constantFieldErrors.occurredTo = h.instant("ERRORS.END_BEFORE_START")),
            O.occurredFrom && O.occurredFrom > new Date && (O.constantFieldErrors.occurred = h.instant("ERRORS.FUTURE_DATES")),
            0 === Object.keys(O.constantFieldErrors).length)
                return O.constantFieldErrors = null,
                "";
            var b = _.map(O.constantFieldErrors, function(a) {
                return "<p>" + a + "</p>"
            });
            return b.join("")
        }
        function K() {
            var a = e.location.href;
            e.history.back(),
            g(function() {
                e.location.href === a && e.close()
            }, 200)
        }
        function L() {
            if (e.confirm(h.instant("RECORD.REALLY_DELETE"))) {
                var b = {
                    archived: !0,
                    uuid: O.record.uuid
                };
                n.update(b, function(b) {
                    a.debug("Deleted record with uuid: ", b.uuid),
                    c.go("record.list")
                }, function(b) {
                    a.debug("Error while deleting record:", b),
                    N(["<p>", h.instant("ERRORS.CREATING_RECORD"), "</p><p>", b.status, ": ", b.statusText, "</p>"].join(""));
                })
            }
        }
        function M() {
            var b = J();
            if (O.editor.errors.length > 0)
                return a.debug("json-editor errors on save:", O.editor.errors),
                O.editor.errors.forEach(function(a) {
                    var c = a.path.substring(a.path.lastIndexOf(".") + 1);
                    b += ["<p>", c, ": ", a.message, "</p>"].join("")
                }),
                void N(b);
            if (b.length > 0)
                return void N(b);
            var d = null
              , e = null;
            O.isSecondary && O.occurredTo || (O.occurredTo = O.occurredFrom),
            z(!0),
            O.record && O.record.geom ? (O.record.schema = O.recordSchema.uuid,
            O.record.geom.coordinates = [O.geom.lng, O.geom.lat],
            O.record.location_text = O.nominatimLocationText,
            O.record.city = O.nominatimCity,
            O.record.city_district = O.nominatimCityDistrict,
            O.record.county = O.nominatimCounty,
            O.record.neighborhood = O.nominatimNeighborhood,
            O.record.road = O.nominatimRoad,
            O.record.state = O.nominatimState,
            O.record.weather = O.weather,
            O.record.light = O.light,
            O.record.occurred_from = O.occurredFrom,
            O.record.occurred_to = O.occurredTo,
            d = "update",
            e = O.record,
            e.data = P) : (d = "create",
            e = {
                data: P,
                schema: O.recordSchema.uuid,
                geom: "POINT(" + O.geom.lng + " " + O.geom.lat + ")",
                location_text: O.nominatimLocationText,
                city: O.nominatimCity,
                city_district: O.nominatimCityDistrict,
                county: O.nominatimCounty,
                neighborhood: O.nominatimNeighborhood,
                road: O.nominatimRoad,
                state: O.nominatimState,
                weather: O.weather,
                light: O.light,
                occurred_from: O.occurredFrom,
                occurred_to: O.occurredTo
            }),
            n[d](e, function(b) {
                a.debug("Saved record with uuid: ", b.uuid),
                O.isSecondary ? c.go("map") : c.go("record.list")
            }, function(b) {
                a.debug("Error while creating record:", b);
                var c = "<p>" + h.instant("ERRORS.CREATING_RECORD") + "</p><p>";
                c += b.data ? _.flatten(_.values(b.data)).join("<br>") : b.status + ": " + b.statusText,
                c += "</p>",
                N(c)
            })
        }
        function N(a) {
            m.show({
                displayClass: "alert-danger",
                header: h.instant("ERRORS.RECORD_NOT_SAVED"),
                html: a
            })
        }
        var O = this
          , P = null
          , Q = null
          , R = !0;
        O.$onInit = u()
    }
    a.$inject = ["$log", "$scope", "$state", "$stateParams", "$window", "$q", "$timeout", "$translate", "uuid4", "AuthService", "JsonEditorDefaults", "Nominatim", "Notifications", "Records", "RecordState", "RecordSchemaState", "RecordTypes", "WeatherService", "WebConfig", "DateLocalization"],
    angular.module("driver.views.record").controller("RecordAddEditController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/views/record/add-edit-partial.html",
            controller: "RecordAddEditController",
            controllerAs: "ctl",
            bindToController: !0
        };
        return a
    }
    angular.module("driver.views.record").directive("driverRecordAddEdit", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f() {
            g().then(h)
        }
        function g() {
            return b.get({
                id: a.recorduuid
            }).$promise.then(function(a) {
                i.record = a
            })
        }
        function h() {
            return c.query({
                record: a.recorduuid
            }).$promise.then(function(a) {
                i.recordType = a[0],
                d.getSecondary().then(function(a) {
                    return a && a.uuid === i.recordType.uuid ? i.isSecondary = !0 : i.isSecondary = !1,
                    i.record.isSecondary = i.isSecondary,
                    e.get(i.recordType.current_schema).then(function(a) {
                        i.recordSchema = a
                    })
                })
            })
        }
        var i = this;
        f()
    }
    a.$inject = ["$stateParams", "Records", "RecordTypes", "RecordState", "RecordSchemaState"],
    angular.module("driver.views.record").controller("RecordDetailsController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/views/record/details-partial.html",
            controller: "RecordDetailsController",
            controllerAs: "ctl",
            bindToController: !0
        };
        return a
    }
    angular.module("driver.views.record").directive("driverRecordDetails", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f) {
        function g() {
            h.record = b,
            h.recordType = c,
            h.recordSchema = d,
            h.userCanWrite = e,
            h.close = function() {
                a.close()
            }
            ,
            f.getSecondary().then(function(a) {
                a && a.uuid === h.recordType.uuid ? h.record.isSecondary = !0 : h.record.isSecondary = !1,
                h.isSecondary = h.record.isSecondary
            })
        }
        var h = this;
        g()
    }
    a.$inject = ["$modalInstance", "record", "recordType", "recordSchema", "userCanWrite", "RecordState"],
    angular.module("driver.views.record").controller("RecordDetailsModalController", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
        function o() {
            w.isInitialized = !1,
            w.userCanWrite = g.hasWriteAccess(),
            l.getSelected().then(function(a) {
                w.recordType = a
            }).then(p).then(q)
        }
        function p() {
            var a = w.recordType.current_schema;
            return k.get(a).then(function(a) {
                w.recordSchema = a
            }).then(s)
        }
        function q() {
            h.restoreFilters()
        }
        function r(a) {
            w.loadingRecords = !0;
            var b;
            return b = a ? w.currentOffset + a : 0,
            m.djangoQuery(b).then(function(a) {
                w.records = a,
                w.currentOffset = b
            })["finally"](function() {
                w.loadingRecords = !1
            })
        }
        function s() {
            var a = _.filter(w.recordSchema.schema.definitions, function(a, b) {
                return b.indexOf("Details") > -1 ? (w.detailsPropertyKey = b,
                a) : void 0
            });
            return 1 !== a.length ? void c.error("Expected one details definition, found " + a.length) : void (w.headerKeys = _(a[0].properties).omit("_localId").map(function(a, b) {
                return a.propertyName = b,
                a
            }).sortBy("propertyOrder").map("propertyName").value())
        }
        function t() {
            r(-w.numRecordsPerPage)
        }
        function u() {
            r(w.numRecordsPerPage)
        }
        function v(a) {
            d.open({
                templateUrl: "scripts/views/record/details-modal-partial.html",
                controller: "RecordDetailsModalController as modal",
                size: "lg",
                resolve: {
                    record: function() {
                        return a
                    },
                    recordType: function() {
                        return w.recordType
                    },
                    recordSchema: function() {
                        return w.recordSchema
                    },
                    userCanWrite: function() {
                        return w.userCanWrite
                    }
                }
            })
        }
        var w = this;
        w.currentOffset = 0,
        w.numRecordsPerPage = n.record.limit,
        w.maxDataColumns = 4,
        w.getPreviousRecords = t,
        w.getNextRecords = u,
        w.showDetailsModal = v,
        w.restoreFilters = q,
        w.isInitialized = !1,
        w.userCanWrite = !1,
        i.ready().then(o);
        var x = b.$on("driver.filterbar:changed", function() {
            w.isInitialized && (w.currentOffset = 0),
            r().then(function() {
                w.isInitialized = !0
            })
        });
        a.$on("driver.state.recordstate:selected", function(a, b) {
            w.isInitialized && w.recordType !== b && (w.recordType = b,
            p().then(r))
        }),
        a.$on("driver.state.boundarystate:selected", function() {
            w.isInitialized && r()
        }),
        a.$on("$destroy", x)
    }
    a.$inject = ["$scope", "$rootScope", "$log", "$modal", "$state", "uuid4", "AuthService", "FilterState", "InitialState", "Notifications", "RecordSchemaState", "RecordState", "QueryBuilder", "WebConfig"],
    angular.module("driver.views.record").controller("RecordListController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "scripts/views/record/list-partial.html",
            controller: "RecordListController",
            controllerAs: "ctl",
            bindToController: !0
        };
        return a
    }
    angular.module("driver.views.record").directive("driverRecordList", a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        a.html5Mode(c.html5Mode.enabled),
        a.hashPrefix(c.html5Mode.prefix),
        b.otherwise("/")
    }
    function b(a, b) {
        a.debugEnabled(b.debug)
    }
    function c(a, b) {
        a.setDefaults({
            center: b.localization.centerLatLon,
            zoom: b.localization.zoom,
            crs: L.CRS.EPSG3857,
            touchZoom: !1,
            scrollWheelZoom: !1
        })
    }
    function d(a) {
        a.setPrefix("DRIVER.web")
    }
    function e(a, b) {
        a.useStaticFilesLoader({
            prefix: "/static/i18n/",
            suffix: ".json"
        }),
        a.useMissingTranslationHandlerLog(),
        a.useSanitizeValueStrategy("sanitizeParameters"),
        a.use(b.$get().getSelected().id)
    }
    function f(a, b, c, d, e, f) {
        b.defaults.xsrfHeaderName = "X-CSRFToken",
        b.defaults.xsrfCookieName = "csrftoken",
        c.$on("$stateChangeStart", function(a, b, f, g, h) {
            return e.isAuthenticated() ? void 0 : (a.preventDefault(),
            void d.go("login", {
                next: b,
                nextParams: f
            }, {
                notify: !1
            }).then(function() {
                c.$broadcast("$stateChangeSuccess", b, f, g, h)
            }))
        }),
        c.$on(e.events.loggedOut, function() {
            c.user = null
        }),
        c.$on(f.events.logOutUser, function() {
            e.logout()
        }),
        e.isAuthenticated() && c.$broadcast(e.events.loggedIn)
    }
    a.$inject = ["$locationProvider", "$urlRouterProvider", "WebConfig"],
    b.$inject = ["$logProvider", "WebConfig"],
    c.$inject = ["LeafletDefaultsProvider", "WebConfig"],
    d.$inject = ["localStorageServiceProvider"],
    e.$inject = ["$translateProvider", "LanguageStateProvider"],
    f.$inject = ["$cookies", "$http", "$rootScope", "$state", "AuthService", "LogoutInterceptor"],
    angular.module("driver", ["Leaflet", "debounce", "driver.config", "ase.auth", "driver.navbar", "driver.filterbar", "driver.toddow", "driver.state", "driver.stepwise", "driver.views.account", "driver.views.login", "driver.views.dashboard", "driver.views.map", "driver.views.record", "driver.views.duplicates", "ui.router", "LocalStorageModule", "pascalprecht.translate"]).config(a).config(b).config(c).config(d).config(e).run(f)
}(),
angular.module("driver").run(["$templateCache", function(a) {
    "use strict";
    a.put("scripts/audit/audit-download-modal-partial.html", '<div class="audit-download"> <div class="close" ng-click="modal.close()"> &times; </div> <div class="modal-header"> <h3 class="modal-title">{{ \'MANAGEMENT.AUDIT_LOGS\' | translate }}</h3> </div> <div class="modal-body"> <input type="number" ng-model="modal.selectedYear" min="1900" max="{{modal.currentYear}}" ng-change="modal.onDateChange()"> <select class="month-select" ng-model="modal.selectedMonth" ng-options="+index as month | translate for (index, month) in modal.months" ng-change="modal.onDateChange()"> </select> <div ng-if="modal.error" class="error">{{ modal.error }}</div> </div> <div class="modal-footer"> <button class="btn" ng-class="{\'btn-primary\': !modal.pending}" ng-click="modal.onDownloadClicked()"> <span ng-if="!modal.pending">{{ \'COMMON.DOWNLOAD_CSV\' | translate }}</span> <span ng-if="modal.pending">{{ \'COMMON.DOWNLOADING\' | translate }} <fading-circle-spinner></fading-circle-spinner></span> </button> <button class="btn btn-primary" ng-click="modal.close()">{{ \'COMMON.CLOSE\' | translate }} </button> </div> </div>'),
    a.put("scripts/black-spots/black-spots-partial.html", '<div class="black-spots"> </div>'),
    a.put("scripts/custom-reports/custom-report-partial.html", '<cube-grid-spinner ng-if="ctl.loading"></cube-grid-spinner> <div class="table-view custom-report" ng-if="!ctl.loading"> <table class="table" ng-repeat="table in ctl.report.tables"> <caption class="text-right-on-rtl"> <h2 ng-if="!isRightToLeft"> <span>{{ ::ctl.params.occurred_min | localizeRecordDate : "long" }}</span> - <span>{{ ::ctl.params.occurred_max | localizeRecordDate : "long" }}</span> </h2> <h2 ng-if="isRightToLeft"> <span>{{ ::ctl.params.occurred_max | localizeRecordDate : "long" }}</span> - <span>{{ ::ctl.params.occurred_min | localizeRecordDate : "long" }}</span> </h2> <h3> {{ ctl.recordType.plural_label }} <span ng-if="ctl.params.aggregation_boundary"> {{ \'REPORT.AREA_FOR\' | translate }} {{ ::ctl.report.table_labels[table.tablekey] }} </span> {{ \'REPORT.CATEGORY_BY\' | translate }} {{ ::ctl.rowCategoryLabel }} {{ \'REPORT.CATEGORY_AND\' | translate }} {{ ::ctl.colCategoryLabel }} </h3> </caption> <thead table-data-string="ctl.headerHTML"></thead> <tbody table-data-string="table.bodyHTML"></tbody> </table> <div ng-if="ctl.error" class="error">{{ \'ERRORS.ERROR\' | translate }}: {{ ctl.error }}</div> </div>'),
    a.put("scripts/custom-reports/custom-reports-modal-partial.html", '<div class="custom-reports"> <div class="close" ng-click="modal.closeModal()"> &times; </div> <div class="modal-header"> <h3>{{ \'REPORT.TITLE\' | translate }}</h3> </div> <div class="modal-body"> <div class="well"> <h4>{{ \'REPORT.ACTIVE_FILTERS\' | translate }}</h4> <div> <strong>{{ \'COMMON.DATE_RANGE\' | translate }}:</strong> <span>{{ ::modal.dateFilter.minDate | localizeRecordDate : modal.dateFormat }}</span> - <span>{{ ::modal.dateFilter.maxDate | localizeRecordDate : modal.dateFormat }}</span> </div> <div ng-if="modal.boundaryFilter"> <strong>{{ \'REPORT.BOUNDARY\' | translate }}:</strong> <span>{{ ::modal.boundaryFilter }}</span> </div> <div ng-if="modal.nonDateFilters | savedFilterAsHTML"> <span ng-bind-html="modal.nonDateFilters | savedFilterAsHTML: \'<br />\'"></span> </div> <h6> <em>{{ \'REPORT.FILTER_NOTICE\' | translate }}</em> </h6> </div> <div class="col-md-6"> <label class="control-label">{{ \'REPORT.ORGANIZE_ROWS\' | translate }}</label> <select ng-options="agg as agg.label\n                                group by agg.type\n                                for agg in modal.rowColAggs\n                                | orderBy: \'label\'" ng-model="modal.rowAggSelected" ng-change="modal.onParamChanged()" class="form-control"> </select> </div> <div class="col-md-6"> <label class="control-label">{{ \'REPORT.ORGANIZE_COLUMNS\' | translate }}</label> <select ng-options="agg as agg.label\n                                group by agg.type\n                                for agg in modal.rowColAggs\n                                | orderBy: \'label\'" ng-model="modal.colAggSelected" ng-change="modal.onParamChanged()" class="form-control"> </select> </div> <div class="col-md-12" ng-if="modal.colAggSelected && modal.rowAggSelected\n                    && modal.colAggSelected.type !== \'Geography\'\n                    && modal.rowAggSelected.type !== \'Geography\'"> <label class="control-label"> {{ \'REPORT.GEO_AGG\' | translate }} ({{ \'REPORT.PAGES\' | translate }} &mdash; <em>{{ \'REPORT.OPTIONAL\' | translate }}</em>) </label> <select ng-options="agg as agg.label for agg in modal.rowColAggs\n                                | filter: { type: \'Geography\' }\n                                | orderBy: \'label\'" ng-model="modal.geoAggSelected" ng-change="modal.onParamChanged()" class="form-control"> <option [ngStyle]="{'font-family':fontFamily}"  value=""></option> </select> </div> </div> <div class="modal-footer"> <button class="btn btn-default" ng-click="modal.closeModal()"> {{ \'COMMON.CANCEL\' | translate }} </button> <button class="btn btn-default" ng-click="modal.createReport()" ng-disabled="!modal.ready"> {{ \'REPORT.TITLE\' | translate }} </button> </div> </div>'),
    a.put("scripts/details/details-constants-partial.html", '<div class="col-sm-6"> <label> {{ \'RECORD.OCCURRED\' | translate }} </label> <div class="value constant date occurred"> {{ ::ctl.record.occurred_from | localizeRecordDate: ctl.dateFormat : true }} <span ng-if="::ctl.record.isSecondary && ctl.record.occurred_to"> - {{ ::ctl.record.occurred_to | localizeRecordDate: ctl.dateFormat : true }} </span> </div> <label> {{ \'RECORD.MODIFIED\' | translate }} </label> <div class="value constant date"> {{ ::ctl.record.modified | localizeRecordDate: ctl.dateFormat : true }} </div> </div> <div class="col-sm-6"> <label> {{ \'RECORD.CREATED\' | translate }} </label> <div class="value constant date created"> {{ ::ctl.record.created | localizeRecordDate: \'long\':\'time\'}} </div> <div ng-if="ctl.record.modified_by"> <label> {{ \'RECORD.MODIFIED_BY\' | translate }} </label> <div class="value constant modifiedby"> {{ ctl.record.modified_by }} </div> </div> </div> <div class="col-sm-12"> <label> {{ \'RECORD.LOCATION\' | translate }} </label> <div class="value constant"> {{ ::ctl.record.location_text }} </div> </div> <div class="col-md-12"> <div class="map" leaflet-map driver-embed-map lat="{{ ::ctl.record.geom.coordinates[1] }}" lng="{{ ::ctl.record.geom.coordinates[0] }}"> </div> </div> <div class="col-sm-6"> <label> {{ \'RECORD.LATITUDE\' | translate }} </label> <div class="value constant float latitude"> {{ ::ctl.record.geom.coordinates[1] | number:5 }} </div> </div> <div class="col-sm-6"> <label> {{ \'RECORD.LONGITUDE\' | translate }} </label> <div class="value constant float longitude"> {{ ::ctl.record.geom.coordinates[0] | number:5 }} </div> </div> <div ng-if="::!ctl.record.isSecondary" class="col-sm-6"> <label> {{ \'RECORD.Weather\' | translate }} </label> <div> <i ng-if="ctl.record.weather" class="wi wi-forecast-io-{{ ::ctl.record.weather }}"></i> <span class="value constant string weather"> {{ ::ctl.record.weather | weatherLabel | translate }} </span> </div> <a href="https://forecast.io" ng-if="ctl.record.weather" target="_blank"> {{ \'RECORD.POWERED_BY_FORECAST\' | translate }} </a> </div> <div ng-if="::!ctl.record.isSecondary" class="col-sm-6"> <label> {{ \'RECORD.LIGHT\' | translate }} </label> <div class="value constant string light"> {{ ::ctl.record.light | weatherLabel | translate }} </div> </div>'),
    a.put("scripts/details/details-field-partial.html", '<div ng-switch on="ctl.property.fieldType"> <driver-details-image ng-switch-when="image" property="ctl.property" data="ctl.data" compact="ctl.compact"> </driver-details-image> <driver-details-reference ng-switch-when="reference" property="ctl.property" data="ctl.data" record="ctl.record" record-schema="ctl.recordSchema" compact="ctl.compact"> </driver-details-reference> <driver-details-selectlist ng-switch-when="selectlist" property="ctl.property" data="ctl.data" record="ctl.record" compact="ctl.compact" is-secondary="ctl.isSecondary"> </driver-details-selectlist> <driver-details-text ng-switch-when="text" property="ctl.property" data="ctl.data" compact="ctl.compact"> </driver-details-text> <driver-details-number ng-switch-when="number" property="ctl.property" data="ctl.data" compact="ctl.compact"> </driver-details-number> <driver-details-integer ng-switch-when="integer" property="ctl.property" data="ctl.data" compact="ctl.compact"> </driver-details-integer> <div ng-switch-default> {{ \'ERRORS.NO_RENDERER\' | translate }}: {{ ::property.fieldType }} </div> </div>'),
    a.put("scripts/details/details-image-partial.html", '<div ng-class="{ \'compact\': ctl.compact, \'col-sm-6\': !ctl.compact }"> <label ng-if="!ctl.compact"> {{ ::ctl.property.propertyName }} </label> <div class="value image"> <img ng-src="{{ ::ctl.data }}"> </div> </div>'),
    a.put("scripts/details/details-integer-partial.html", '<div ng-class="{ \'compact\': ctl.compact, \'col-sm-6\': !ctl.compact }"> <label ng-if="!ctl.compact"> {{ ::ctl.property.propertyName }} </label> <div> <div class="value integer"> {{ ctl.data }} </div> </div> </div>'),
    a.put("scripts/details/details-multiple-partial.html", '<div class="incident-report"> <cube-grid-spinner ng-if="ctl.definition.pending"></cube-grid-spinner> <div class="table" ng-if="!ctl.definition.pending"> <div class="table-head"> <div class="row"> <div class="col-sm-3" ng-repeat="property in ctl.properties | limitTo : ctl.maxDataColumns"> {{ ::property.propertyName }} </div> </div> </div> <div class="table-body"> <div class="table-body-row" ng-repeat="item in ctl.data"> <div class="table-body-row-header" ng-click="item.open = !item.open" ng-class="{\'open\': item.open}"> <div class="row"> <div class="col-sm-3" ng-repeat="property in ctl.properties | limitTo : ctl.maxDataColumns"> <driver-details-field compact="true" data="::item[property.propertyName]" record="::ctl.record" record-schema="::ctl.recordSchema" property="::property" is-secondary="ctl.isSecondary"> </driver-details-field> </div> </div> </div> <div class="table-body-row-content"> <div class="row"> <driver-details-single data="item" properties="ctl.properties" record="ctl.record" record-schema="::ctl.recordSchema" is-secondary="ctl.isSecondary"> </driver-details-single> </div> </div> </div> </div> </div> </div>'),
    a.put("scripts/details/details-number-partial.html", '<div ng-class="{ \'compact\': ctl.compact, \'col-sm-6\': !ctl.compact }"> <label ng-if="!ctl.compact"> {{ ::ctl.property.propertyName }} </label> <div> <div class="value number"> {{ ctl.data }} </div> </div> </div>'),
    a.put("scripts/details/details-reference-partial.html", '<div ng-class="{ \'compact\': ctl.compact, \'col-sm-6\': !ctl.compact }"> <label ng-if="!ctl.compact"> {{ ::ctl.property.propertyName }} </label> <div class="value reference"> {{ ::ctl.referenceDisplay }} </div> </div>'),
    a.put("scripts/details/details-selectlist-partial.html", '<div ng-class="{ \'compact\': ctl.compact, \'col-sm-6\': !ctl.compact }"> <label ng-if="!ctl.compact"> {{ ::ctl.property.propertyName }} </label> <div class="value selectlist" ng-if="!(ctl.record.isSecondary || ctl.isSecondary)"> {{ ::ctl.data }} </div> <div class="value selectlist" ng-if="ctl.record.isSecondary || ctl.isSecondary" ng-switch on="ctl.data"> <span ng-switch-when="I01">{{ \'INTERVENTION_TYPE.I01\' | translate }}</span> <span ng-switch-when="I02">{{ \'INTERVENTION_TYPE.I02\' | translate }}</span> <span ng-switch-when="I03">{{ \'INTERVENTION_TYPE.I03\' | translate }}</span> <span ng-switch-when="I04">{{ \'INTERVENTION_TYPE.I04\' | translate }}</span> <span ng-switch-when="I05">{{ \'INTERVENTION_TYPE.I05\' | translate }}</span> <span ng-switch-when="I06">{{ \'INTERVENTION_TYPE.I06\' | translate }}</span> <span ng-switch-when="I07">{{ \'INTERVENTION_TYPE.I07\' | translate }}</span> <span ng-switch-when="I08">{{ \'INTERVENTION_TYPE.I08\' | translate }}</span> <span ng-switch-when="I09">{{ \'INTERVENTION_TYPE.I09\' | translate }}</span> <span ng-switch-when="I10">{{ \'INTERVENTION_TYPE.I10\' | translate }}</span> <span ng-switch-when="I11">{{ \'INTERVENTION_TYPE.I11\' | translate }}</span> <span ng-switch-when="I12">{{ \'INTERVENTION_TYPE.I12\' | translate }}</span> <span ng-switch-when="I13">{{ \'INTERVENTION_TYPE.I13\' | translate }}</span> <span ng-switch-when="I14">{{ \'INTERVENTION_TYPE.I14\' | translate }}</span> <span ng-switch-when="I15">{{ \'INTERVENTION_TYPE.I15\' | translate }}</span> <span ng-switch-when="I16">{{ \'INTERVENTION_TYPE.I16\' | translate }}</span> <span ng-switch-when="I17">{{ \'INTERVENTION_TYPE.I17\' | translate }}</span> <span ng-switch-when="I18">{{ \'INTERVENTION_TYPE.I18\' | translate }}</span> <span ng-switch-when="I19">{{ \'INTERVENTION_TYPE.I19\' | translate }}</span> <span ng-switch-when="I20">{{ \'INTERVENTION_TYPE.I20\' | translate }}</span> <span ng-switch-when="I21">{{ \'INTERVENTION_TYPE.I21\' | translate }}</span> <span ng-switch-when="I22">{{ \'INTERVENTION_TYPE.I22\' | translate }}</span> <span ng-switch-when="I23">{{ \'INTERVENTION_TYPE.I23\' | translate }}</span> <span ng-switch-when="I24">{{ \'INTERVENTION_TYPE.I24\' | translate }}</span> <span ng-switch-when="I25">{{ \'INTERVENTION_TYPE.I25\' | translate }}</span> <span ng-switch-when="I26">{{ \'INTERVENTION_TYPE.I26\' | translate }}</span> <span ng-switch-when="I27">{{ \'INTERVENTION_TYPE.I27\' | translate }}</span> <span ng-switch-when="I28">{{ \'INTERVENTION_TYPE.I28\' | translate }}</span> <span ng-switch-when="I29">{{ \'INTERVENTION_TYPE.I29\' | translate }}</span> <span ng-switch-when="I30">{{ \'INTERVENTION_TYPE.I30\' | translate }}</span> <span ng-switch-when="I31">{{ \'INTERVENTION_TYPE.I31\' | translate }}</span> <span ng-switch-when="I32">{{ \'INTERVENTION_TYPE.I32\' | translate }}</span> <span ng-switch-when="I33">{{ \'INTERVENTION_TYPE.I33\' | translate }}</span> <span ng-switch-when="I34">{{ \'INTERVENTION_TYPE.I34\' | translate }}</span> <span ng-switch-when="I35">{{ \'INTERVENTION_TYPE.I35\' | translate }}</span> <span ng-switch-when="I36">{{ \'INTERVENTION_TYPE.I36\' | translate }}</span> <span ng-switch-when="I37">{{ \'INTERVENTION_TYPE.I37\' | translate }}</span> <span ng-switch-when="I38">{{ \'INTERVENTION_TYPE.I38\' | translate }}</span> <span ng-switch-when="I39">{{ \'INTERVENTION_TYPE.I39\' | translate }}</span> <span ng-switch-when="I40">{{ \'INTERVENTION_TYPE.I40\' | translate }}</span> <span ng-switch-when="I41">{{ \'INTERVENTION_TYPE.I41\' | translate }}</span> <span ng-switch-when="I42">{{ \'INTERVENTION_TYPE.I42\' | translate }}</span> <span ng-switch-when="I43">{{ \'INTERVENTION_TYPE.I43\' | translate }}</span> <span ng-switch-when="I44">{{ \'INTERVENTION_TYPE.I44\' | translate }}</span> <span ng-switch-when="I45">{{ \'INTERVENTION_TYPE.I45\' | translate }}</span> <span ng-switch-when="I48">{{ \'INTERVENTION_TYPE.I48\' | translate }}</span> <span ng-switch-when="I50">{{ \'INTERVENTION_TYPE.I50\' | translate }}</span> <span ng-switch-when="I51">{{ \'INTERVENTION_TYPE.I51\' | translate }}</span> <span ng-switch-when="I52">{{ \'INTERVENTION_TYPE.I52\' | translate }}</span> <span ng-switch-when="I53">{{ \'INTERVENTION_TYPE.I53\' | translate }}</span> <span ng-switch-when="I54">{{ \'INTERVENTION_TYPE.I54\' | translate }}</span> <span ng-switch-when="I55">{{ \'INTERVENTION_TYPE.I55\' | translate }}</span> <span ng-switch-when="I56">{{ \'INTERVENTION_TYPE.I56\' | translate }}</span> <span ng-switch-when="I57">{{ \'INTERVENTION_TYPE.I57\' | translate }}</span> <span ng-switch-when="I58">{{ \'INTERVENTION_TYPE.I58\' | translate }}</span> <span ng-switch-when="I59">{{ \'INTERVENTION_TYPE.I59\' | translate }}</span> <span ng-switch-when="I60">{{ \'INTERVENTION_TYPE.I60\' | translate }}</span> <span ng-switch-when="I61">{{ \'INTERVENTION_TYPE.I61\' | translate }}</span> <span ng-switch-default>{{ ::ctl.data }}</span> </div> </div>'),
    a.put("scripts/details/details-single-partial.html", '<cube-grid-spinner ng-if="ctl.definition.pending"></cube-grid-spinner> <driver-details-constants ng-if="ctl.definition.details" record="ctl.record"> </driver-details-constants> <div ng-repeat="property in ctl.properties" ng-if="!ctl.definition.pending"> <driver-details-field property="property" data="ctl.data[property.propertyName]" record="ctl.record" record-schema="ctl.recordSchema" is-secondary="ctl.isSecondary"> </driver-details-field> </div>'),
    a.put("scripts/details/details-tabs-partial.html", '<tabset> <tab ng-repeat="definition in ctl.sortedDefinitions" heading="{{ definition.multiple ? definition.plural_title : definition.title }}" ng-init="properties = ctl.sortedProperties(definition.properties)"> <driver-details-single ng-if="!definition.multiple" data="::ctl.record.data[definition.propertyKey]" properties="::properties" record="ctl.record" record-schema="ctl.recordSchema" definition="::definition" is-secondary="ctl.isSecondary"> </driver-details-single> <driver-details-multiple ng-if="definition.multiple" data="::ctl.record.data[definition.propertyKey]" properties="::properties" record="ctl.record" record-schema="ctl.recordSchema" definition="::definition" is-secondary="ctl.isSecondary"> </driver-details-multiple> </tab> </tabset>'),
    a.put("scripts/details/details-text-partial.html", '<div ng-class="{ \'compact\': ctl.compact, \'col-sm-6\': !ctl.compact }"> <label ng-if="!ctl.compact"> {{ ::ctl.property.propertyName }} </label> <div ng-switch on="ctl.property.format"> <div ng-switch-when="color" class="value color"> <svg> <rect class="rectangle" rx="20" ry="20" style="fill:{{ ::ctl.data }}" ng-attr-x="{{ ctl.xShift() }}"> </svg> </div> <div ng-switch-when="textarea" class="value textarea"> <pre ng-if="!ctl.compact">{{ ::ctl.data }}</pre> <span ng-if="ctl.compact"> {{ ::ctl.data | limitTo: ctl.maxLength }} <span ng-if="ctl.data.length > ctl.maxLength"> {{ \'COMMON.ELLIPSIS\' | translate }} </span> </span> </div> <div ng-switch-when="url" class="value url"> <a href="{{ ctl.data }}">{{ ::ctl.data }}</a> </div> <div ng-switch-default class="value text"> {{ ::ctl.data }} </div> </div> </div>'),
    a.put("scripts/enforcers/enforcer-assignments-partial.html", '<cube-grid-spinner ng-if="ctl.loading"></cube-grid-spinner> <div class="enforcer-assignments print-view" ng-if="!ctl.loading"> <div class="assignments-header"> <button ng-click="ctl.printPage()" class="pull-right"> {{ \'ENFORCERS.PRINT\' | translate }} </button> <h2> {{ \'ENFORCERS.ASSIGNMENTS_TITLE\' | translate }} </h2> </div> <div class="assignment-pages-container"> <div ng-repeat="assignment in ctl.assignments" class="assignment-pages"> <div class="assignment-header" ng-if="$index % 3 === 0"> <h3 ng-if="!isRightToLeft"> <span>{{ ::ctl.params.shift_start | localizeRecordDate :ctl.dateFormat :\'time\' :\'noseconds\' }}</span>&ndash;<span>{{ ::ctl.params.shift_end | localizeRecordDate :ctl.dateFormat :\'time\' :\'noseconds\' }}</span> </h3> <h4> {{ ::ctl.params.num_personnel }} {{ \'ENFORCERS.ASSIGNMENTS_FOR\' | translate }} {{ ctl.areaName }} </h4> <h3 ng-if="isRightToLeft"> <span>{{ ::ctl.params.shift_end | localizeRecordDate :ctl.dateFormat :\'time\' :\'noseconds\' }}</span> &ndash; <span>{{ ::ctl.params.shift_start | localizeRecordDate :ctl.dateFormat :\'time\' :\'noseconds\' }}</span> </h3> </div> <div class="assignment" ng-class="{\'third\': $index % 3 === 2}"> <div class="assignment-left"> <div class="map assignment-map" leaflet-map assignment-map geom="assignment.geom.coordinates"></div> </div> <div class="assignment-right"> <div class="assignment-details"> <table> <tr> <td>{{ \'ENFORCERS.ASSIGNMENT\' | translate }}:</td> <td><b>{{ \'ENFORCERS.ASSIGNMENT\' | translate }} {{$index + 1}}</b></td> </tr> <tr> <td>{{ \'ENFORCERS.LOCATION\' | translate }}:</td> <td><b>{{ assignment.latitude | number }}, {{ assignment.longitude | number }}</b></td> </tr> <tr> <td>{{ \'ENFORCERS.NOTES\' | translate }}:</td> <td> <hr><hr><hr><hr><hr><hr> </td> </tr> </table> </div> </div> </div> </div> </div> <div ng-if="ctl.error" class="error">{{ \'ERRORS.ERROR\' | translate }}: {{ ctl.error }}</div> </div>'),
    a.put("scripts/enforcers/enforcers-modal-partial.html", '<div class="enforcer-assignment-modal"> <div class="close" ng-click="modal.closeModal()"> &times; </div> <div class="modal-header"> <h3>{{ \'ENFORCERS.ASSIGNMENTS_TITLE\' | translate }}</h3> </div> <div class="modal-body"> <div class="well"> <h4>{{ \'ENFORCERS.SELECTED_BOUNDARY\' | translate }}</h4> <div ng-if="modal.polygonName"> <span>{{ ::modal.polygonName }}</span> </div> <h6 ng-if="modal.polygon"> {{ \'ENFORCERS.CUSTOM_BOUNDARY\' | translate }} </h6> <h6> <em>{{ \'ENFORCERS.BOUNDARY_NOTICE\' | translate }}</em> </h6> </div> <div class="row"> <div class="col-md-6 clearfix"> <label class="control-label">{{ \'ENFORCERS.SHIFT_START\' | translate }}</label> <az-date-time-picker datetime="modal.shiftStart" on-change="modal.onParamChanged()"> </az-date-time-picker> </div> <div class="col-md-6 clearfix"> <label class="control-label">{{ \'ENFORCERS.SHIFT_END\' | translate }}</label> <az-date-time-picker datetime="modal.shiftEnd" on-change="modal.onParamChanged()"> </az-date-time-picker> </div> </div> <div class="col-md-12 warning" ng-if="modal.error">{{ modal.error }}</div> <div class="row"> <div class="col-md-6 col-xs-12 pull-left col-personnel"> <label class="control-label">{{ \'ENFORCERS.NUM_PERSONNEL\' | translate }}</label> <input ng-model="modal.numPersonnel" type="number" min="1" class="form-control" ng-change="modal.onParamChanged()"> </div> </div> </div> <div class="modal-footer"> <button class="btn btn-default" ng-click="modal.closeModal()"> {{ \'COMMON.CANCEL\' | translate }} </button> <button class="btn btn-default" ng-click="modal.createAssignments()" ng-disabled="!modal.ready"> {{ \'ENFORCERS.ASSIGNMENTS\' | translate }} </button> </div> </div>'),
    a.put("scripts/filterbar/date-range.html", '<button id="date-range" role="button" ng-class="error.btnClasses" class="ng-binding btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"> {{ buttonLabel | translate }} <span class="caret"></span> </button> <ul class="dropdown-menu alert date-range" ng-class="error.classes" role="menu" aria-labelledby="record-type" ng-click="$event.stopPropagation()"> <li class="nav-rt-item ng-scope" role="menuitem"> <span ng-show="isMinMaxValid()">{{ helpLabel | translate }}</span> <span ng-hide="isMinMaxValid()">{{ \'ERRORS.INVALID_RANGE\' | translate }}</span> <div class="ng-binding pull-right form-inline"> <div class="input-group input-daterange"> <input name="minimum" ng-model="min" ng-change="onDtRangeChange(\'min\')" type="text" class="dt-min-field form-control date-range-style date-range-input"> <span class="input-group-addon">{{ \'COMMON.TO\' | translate }}</span> <input name="maximum" ng-model="max" ng-change="onDtRangeChange(\'max\')" type="text" class="dt-max-field form-control date-range-style date-range-input"> </div> </div> </li> </ul>'),
    a.put("scripts/filterbar/filterbar.html", '<div class="filterbar drop-shadow"> <div class="pull-left"> <ul class="nav navbar-nav"> <li text-search-field="__searchText"></li> </ul> <ul class="nav navbar-nav"> <li date-range-field="__dateRange" class="dropdown"></li> </ul> <ul class="nav navbar-nav" ng-if="::filterbar.showCreatedDateFilter"> <li date-range-field="__createdRange" class="dropdown"></li> </ul> <ul class="nav navbar-nav" ng-if="::filterbar.showCreatedByFilter"> <li text-search-field="__createdBy"></li> </ul> <ul class="nav navbar-nav" ng-if="::filterbar.showWeatherFilter"> <li weather-field class="dropdown"></li> </ul> <ul class="nav navbar-nav" ng-repeat="(key, value) in filterbar.filterables"> <li ng-if="(value.format === \'number\') || (value.fieldType === \'integer\') || (value.fieldType === \'number\')" numeric-range-field label="key" data="value" class="dropdown"></li> <li ng-if="value.fieldType === \'selectlist\'" options-field label="key" data="value" class="dropdown"> </li> </ul> <ul class="nav navbar-nav"> <li quality-field="__quality"></li> </ul> </div> <div class="pull-right"> <a ng-click="filterbar.showSavedFiltersModal()" class="btn btn-default btn-icon" tooltip-trigger tooltip-placement="{{ isRightToLeft ? \'right\' : \'left\' }}" tooltip-append-to-body tooltip-animation="false" tooltip="{{ \'SAVED_FILTERS.TITLE\' | translate }}"><span class="glyphicon glyphicon-filter"></span></a> <a class="btn btn-default btn-icon" tooltip-trigger tooltip-placement="{{ isRightToLeft ? \'right\' : \'left\' }}" tooltip="{{ \'SAVED_FILTERS.CLEAR\' | translate }}" tooltip-append-to-body tooltip-animation="false" ng-click="filterbar.reset()"><span class="glyphicon glyphicon-remove"></span></a> <a ng-if="::filterbar.userCanAdd" class="btn btn-default btn-icon" tooltip-trigger tooltip-placement="{{ isRightToLeft ? \'right\' : \'left\' }}" tooltip="{{ \'NAV.ADD_A_RECORD\' | translate }}" tooltip-append-to-body tooltip-animation="false" ui-sref="record.add()"><span class="glyphicon glyphicon-plus-sign"></span></a> </div> </div>'),
    a.put("scripts/filterbar/numeric-range.html", '<button id="record-type" role="button" ng-class="error.btnClasses" class="ng-binding btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"> {{ label | labelFormatter }} <span class="caret"></span> </button> <ul class="dropdown-menu alert" ng-class="error.classes" role="menu" aria-labelledby="record-type" ng-click="$event.stopPropagation()"> <li class="nav-rt-item ng-scope" role="menuitem"> <span ng-show="isMinMaxValid()">{{ \'RECORD.NUMERIC_FILTER\' | translate }}</span> <span ng-hide="isMinMaxValid()">{{ \'ERRORS.INVALID_RANGE\' | translate }}</span> <div class="ng-binding form-inline pull-right"> <div class="input-group"> <input type="number" name="minimum" placeholder="{{ \'COMMON.MIN\' | translate }}" min="{{ data.minimum }}" max="{{ data.maximum }}" ng-model="filter.min" ng-change="updateFilter(label, filter)" class="form-control num-range-style"> <span class="input-group-addon">{{ \'COMMON.TO\' | translate }}</span> <input type="number" name="maximum" placeholder="{{ \'COMMON.MAX\' | translate }}" min="{{ data.minimum }}" max="{{ data.maximum }}" ng-model="filter.max" ng-change="updateFilter(label, filter)" class="form-control num-range-style"> </div> </div> </li> </ul>'),
    a.put("scripts/filterbar/options.html", '<div class="btn-group dropdown options open" ng-class="{ \'active\': filter.contains.length }"> <div class="form-group"> <select data-ng-options="val for val in data.enum || data.items.enum" data-selected-text-format="static" data-title="{{ label | labelFormatter }}" class="selectpicker form-control" id="{{ domID }}" multiple="multiple" name="options[]" ng-model="filter.contains" ng-change="updateFilter(label)"> </select> </div> </div>'),
    a.put("scripts/filterbar/quality.html", '<div class="btn-group dropdown options open" ng-class="{ \'active\': ctl.value.length }" ng-if="ctl.qualityChecks.length > 0"> <div class="form-group"> <select class="selectpicker form-control" data-title="{{ \'RECORD.QUALITY_CHECKS\' | translate }}" data-selected-text-format="static" multiple="multiple" ng-model="ctl.value" ng-change="ctl.updateFilter()"> <option [ngStyle]="{'font-family':fontFamily}"  ng-repeat="check in ctl.qualityChecks" value="{{ check.key }}"> {{ check.label | translate }} </option> </select> </div> </div>'),
    a.put("scripts/filterbar/text-search.html", '<input class="form-control" type="search" placeholder="{{ placeholderLabel | translate }}" ng-model="searchText"> '),
    a.put("scripts/filterbar/weather.html", '<div class="btn-group dropdown options open" ng-class="{ \'active\': ctl.value.length }"> <div class="form-group"> <select data-selected-text-format="static" data-title="{{ \'RECORD.WEATHER\' | translate }}" class="selectpicker form-control" multiple="multiple" name="options[]" ng-model="ctl.value" ng-change="ctl.updateFilter()"> <option [ngStyle]="{'font-family':fontFamily}"  ng-repeat="weatherVal in ctl.weatherValues" value="{{ weatherVal }}"> {{ weatherVal | weatherLabel | translate }} </option> </select> </div> </div>'),
    a.put("scripts/localization/date-picker-partial.html", '<input type="text" class="form-control" placeholder="{{ placeholder }}">'),
    a.put("scripts/localization/datetime-picker-partial.html", '<div class="locale-datetime-picker"> <div class="date-picker input-group"> <az-date-picker class="date-picker" datetime="ctl.date" on-change="ctl.updateDate()" placeholder="{{ \'COMMON.FROM\' | translate }}"> </az-date-picker></div> <div class="time-picker"> <timepicker class="input-group" ng-model="ctl.time" show-meridian="false" ng-change="ctl.updateTime()"> </timepicker> </div> </div>'),
    a.put("scripts/navbar/navbar-partial.html", '<nav class="navbar navbar-default {{ctl.isFilterPage ? \'\' : \'drop-shadow\' }}"> <div class="container-fluid"> <div class="navbar-header"> <a class="navbar-brand" ui-sref="dashboard">{{ \'COMMON.APP_NAME\' | translate }}</a> </div> <div class="collapse navbar-collapse"> <ul class="nav navbar-nav" ng-if="ctl.authenticated"> <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" role="button"> {{ ctl.stateSelected.label | translate }} <span class="caret"></span></a> <ul class="dropdown-menu"> <li class="nav-page-item" ng-repeat="navState in ctl.availableStates"> <a ng-click="ctl.onStateSelected(navState)"> {{ navState.label | translate }} </a> </li> </ul> </li> <li class="dropdown" ng-if="ctl.recordTypesVisible"> <a class="dropdown-toggle" data-toggle="dropdown" role="button"> {{ ctl.recordTypeSelected.plural_label }} <span class="caret"></span></a> <ul class="dropdown-menu"> <li class="nav-rt-item" ng-repeat="recordType in ctl.recordTypeResults | orderBy:\'plural_label\'"> <a ng-click="ctl.onRecordTypeSelected(recordType)"> {{ recordType.plural_label }} </a> </li> </ul> </li> <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" role="button"> {{ ctl.geographySelected.label }} <span class="caret"></span></a> <ul class="dropdown-menu"> <li class="nav-rt-item" ng-repeat="geography in ctl.geographyResults | orderBy:\'label\'"> <a ng-click="ctl.onGeographySelected(geography)"> {{ geography.label }} </a> </li> </ul> </li> <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" role="button"> {{ ctl.getBoundaryLabel(ctl.boundarySelected) }} <span class="caret"></span></a> <ul class="dropdown-menu"> <li class="nav-rt-item"> <a ng-click="ctl.onBoundarySelected({ uuid: \'\' })">{{ \'NAV.ALL\' | translate }}</a> </li> <li class="nav-rt-item" ng-repeat="boundary in ctl.boundaryResults | orderBy:ctl.getBoundaryLabel" ng-if="ctl.getBoundaryLabel(boundary)"> <a ng-click="ctl.onBoundarySelected(boundary)"> {{ ctl.getBoundaryLabel(boundary) }} </a> </li> </ul> </li> </ul> <ul ng-if="ctl.authenticated" class="nav navbar-nav navbar-right"> <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" role="button">{{ ctl.userEmail }} <span class="glyphicon glyphicon-option-vertical"></span></a> <ul class="dropdown-menu"> <li> <a ng-click="ctl.navigateToStateName(\'account\')"> {{ \'NAV.MY_ACCOUNT\' | translate }} </a> </li> <li ng-if="ctl.isAdmin"> <a ng-click="ctl.showAuditDownloadModal()"> {{ \'NAV.DOWNLOAD_AUDIT_LOGS\' | translate }} </a> </li> <li ng-if="ctl.hasWriteAccess && ctl.showDuplicateRecordsLink"> <a ng-click="ctl.navigateToStateName(\'duplicates\')"> {{ \'NAV.MANAGE_DUPLICATE_RECORDS\' | translate }} </a> </li> <li> <a ng-click="ctl.onLogoutButtonClicked()"> {{ \'NAV.LOG_OUT\' | translate }} </a> </li> </ul> </li> </ul> <ul class="nav navbar-nav navbar-right" ng-if="ctl.languages.length > 1"> <li class="dropdown"> <a class="dropdown-toggle" data-toggle="dropdown" role="button"> {{ ctl.selectedLanguage.label }} <span class="glyphicon glyphicon-globe"></span> </a> <ul class="dropdown-menu"> <li ng-repeat="language in ctl.languages"> <a ng-click="ctl.onLanguageSelected(language)"> {{ language.label }} </a> </li> </ul> </li> </ul> </div> </div> </nav> <driver-filterbar ng-if="ctl.isFilterPage"></driver-filterbar>'),
    a.put("scripts/notifications/notifications-partial.html", '<div class="notifications alert" ng-hide="!ntf.active" ng-class="ntf.alert.displayClass"> <table ng-if="ntf.alert.text"> <tr> <td><span class="glyphicon" ng-class="ntf.alert.imageClass" ng-if="ntf.alert.imageClass"></span></td> <td>{{ ntf.alert.text }}</td> <td><span class="glyphicon glyphicon-remove pull-right" ng-if="ntf.alert.closeButton" ng-click="ntf.hideAlert()"></span></td> </tr> </table> <div ng-if="ntf.alert.html"> <span class="glyphicon pull-left" ng-class="ntf.alert.imageClass" ng-if="ntf.alert.imageClass"> </span> <span class="glyphicon glyphicon-remove pull-right" ng-if="ntf.alert.closeButton" ng-click="ntf.hideAlert()"> </span> <div class="container-fluid"> <div class="row"> <h4 class="text-center">{{ ntf.alert.header }}</h4> </div> <div class="row"> <div ng-bind-html="ntf.alert.html"></div> </div> </div> </div> </div>'),
    a.put("scripts/recent-counts/recent-counts.html", '<div class="tab-content"> <div role="tabpanel" class="tab-pane active" id="30d"> <h1>{{ recent.month }}</h1> </div> <div role="tabpanel" class="tab-pane" id="90d"> <h1>{{ recent.quarter }}</h1> </div> <div role="tabpanel" class="tab-pane" id="365d"> <h1>{{ recent.year }}</h1> </div> </div> <h2>{{ recent.recordTypePlural }}</h2> <ul class="nav nav-pills" role="tablist"> <li role="presentation" class="active"><a href="#30d" role="tab" data-toggle="tab"> 30 {{ \'DASHBOARD.DAYS\' | translate }} </a></li> <li role="presentation"><a href="#90d" role="tab" data-toggle="tab"> 90 {{ \'DASHBOARD.DAYS\' | translate }} </a></li> <li role="presentation"><a href="#365d" role="tab" data-toggle="tab"> 365 {{ \'DASHBOARD.DAYS\' | translate }} </a></li> </ul>'),
    a.put("scripts/saved-filters/saved-filters-modal-partial.html", '<div class="saved-filters"> <div class="close" ng-click="modal.closeModal()"> &times; </div> <div class="modal-header"> <h3>{{ \'SAVED_FILTERS.TITLE\' | translate }}</h3> </div> <div class="modal-body"> <ase-notifications></ase-notifications> <driver-saved-filters></driver-saved-filters> <div class="well"> <h4>{{ \'SAVED_FILTERS.ADD_NEW\' | translate }}</h4> <form class="form-inline"> <div class="form-group"> <label>{{ \'SAVED_FILTERS.FILTER_NAME\' | translate }}</label> </div> <div class="form-group"> <input ng-model="modal.label" type="text" class="form-control"> </div> <a ng-click="modal.save()" ng-disabled="!modal.label.length" class="btn btn-default"> {{ \'SAVED_FILTERS.SAVE_FILTER\' | translate }} </a> </form> </div> </div> <div class="modal-footer"> <button class="btn btn-default" ng-click="modal.closeModal()"> {{ \'COMMON.CLOSE\' | translate }} </button> </div> </div>'),
    a.put("scripts/saved-filters/saved-filters-partial.html", '<div class="block-inner"> <h3 ng-if="filters.compact">{{ \'SAVED_FILTERS.TITLE\' | translate }}</h3> <div class="report-content tab-content filters-table"> <div ng-show="!filters.savedFilters.length"> <i>{{ \'SAVED_FILTERS.NO_FILTERS_SAVED\' | translate }}</i> </div> <table ng-show="filters.savedFilters.length" class="table table-hover"> <thead ng-if="!filters.compact"> <tr> <td>{{ \'SAVED_FILTERS.NAME\' | translate }}</td> <td>{{ \'SAVED_FILTERS.FILTERS\' | translate }}</td> <td></td> <td></td> </tr> </thead> <tbody> <tr ng-repeat="sf in filters.savedFilters"> <td width="20%"> {{ ::sf.label }} </td> <td width="60%" ng-bind-html="sf.filter_json | savedFilterAsHTML"> </td> <td width="10%"> <a ng-click="filters.viewFilter(sf)"> {{ \'COMMON.VIEW\' | translate }}&nbsp;&raquo; </a> </td> <td width="10%" ng-if="!filters.compact"> <a ng-click="filters.deleteFilter(sf)"> {{ \'COMMON.DELETE\' | translate }} </a> </td> </tr> </tbody> </table> </div> </div>'),
    a.put("scripts/social-costs/social-costs-tool.html", '<div class="tool costs" ng-class="{\'open\': ctl.state === \'subtotal\'}"> <div class="tool-tab total costs" ng-click="ctl.toggle()"> <span ng-if="ctl.costData.outdated_cost_config || ctl.costData.error" class="glyphicon glyphicon-warning-sign"></span> {{ ctl.costData.prefix }}{{ ctl.costData.total | number }}{{ ctl.costData.suffix }} </div> <div class="tool-content"> <div class="tool-header"> <h4>{{ \'DASHBOARD.SOCIAL_COSTS_TEXT\' | translate }}</h4> </div> <hr> <div class="tool-body"> <table class="costs subtotal"> <tbody> <tr ng-repeat="(subkey, subtotal) in ctl.costData.subtotals"> <td>{{ subkey }}:</td><td>{{ ctl.costData.prefix }}{{ subtotal | number }}{{ ctl.costData.suffix }}</td> </tr> </tbody> </table> <div class="warn" ng-if="ctl.costData.outdated_cost_config || ctl.costData.error"> <span class="glyphicon glyphicon-warning-sign"></span> {{ \'DASHBOARD.SOCIAL_COSTS_CONFIG_WARN\' | translate }} </div> </div> </div> </div>'),
    a.put("scripts/social-costs/social-costs.html", '<div class="costs total" ng-click="ctl.toggle()" ng-if="ctl.state === \'total\'"> <h1> {{ ctl.costData.prefix }}{{ ctl.costData.total | number }}{{ ctl.costData.suffix }} </h1> <h2 ng-if="ctl.costData.total || ctl.costData.total === 0"> {{ \'DASHBOARD.SOCIAL_COSTS_TEXT\' | translate }}: {{ \'DASHBOARD.SOCIAL_COSTS_90DAYS\' | translate }} </h2> <div class="warn" ng-if="ctl.costData.outdated_cost_config || ctl.costData.error"> <span class="glyphicon glyphicon-warning-sign"></span> {{ \'DASHBOARD.SOCIAL_COSTS_CONFIG_WARN\' | translate }} </div> </div> <div class="costs subtotal" ng-click="ctl.toggle()" ng-if="ctl.state === \'subtotal\'"> <h2 ng-if="ctl.costData.total || ctl.costData.total === 0"> {{ \'DASHBOARD.SOCIAL_COSTS_TEXT\' | translate }}: {{ \'DASHBOARD.SOCIAL_COSTS_90DAYS\' | translate }} </h2> <hr> <table> <tbody> <tr ng-repeat="(subkey, subtotal) in ctl.costData.subtotals"> <td class="cost-category">{{ subkey }}:</td><td class="subtotal">{{ ctl.costData.prefix }}{{ subtotal | number }}{{ ctl.costData.suffix }}</td> </tr> </tbody> </table> <div class="warn" ng-if="ctl.costData.outdated_cost_config || ctl.costData.error"> <span class="glyphicon glyphicon-warning-sign"></span> {{ \'DASHBOARD.SOCIAL_COSTS_CONFIG_WARN\' | translate }} </div> </div>'),
    a.put("scripts/tools/charts/charts-partial.html", '<div class="tool graphs" ng-class="{ \'open\': ctl.isOpen }"> <div class="tool-tab" ng-click="ctl.toggle()"> <span class="glyphicon glyphicon-list-alt"></span> {{ \'COMMON.GRAPHS\' | translate }} </div> <div class="tool-content" ng-init="activeChart = \'toddow\'"> <div class="tool-header"> <span class="pull-right"> <span class="graph-selector glyphicon glyphicon-th" ng-click="activeChart = \'toddow\'" ng-class="{ \'active\': activeChart === \'toddow\' }"> </span> <span class="graph-selector glyphicon glyphicon-stats" ng-click="activeChart = \'stepwise\'" ng-class="{ \'active\': activeChart === \'stepwise\' }"> </span> </span> <h4>{{ \'COMMON.GRAPHS\' | translate }}</h4> </div> <hr> <div class="tool-body"> <driver-toddow chart-data="ctl.toddow" ng-show="activeChart === \'toddow\'"> </driver-toddow> <driver-stepwise chart-data="ctl.stepwise" min-date="ctl.minDate" max-date="ctl.maxDate" in-dashboard="false" ng-show="activeChart === \'stepwise\'"> </driver-stepwise> </div> </div> </div>'),
    a.put("scripts/tools/enforcers/enforcers-tool-partial.html", '<div class="tool enforcers"> <div class="tool-tab" ng-click="ctl.showEnforcementModal()"> <span class="glyphicon glyphicon-user"></span> {{ \'ENFORCERS.ASSIGNMENTS_TITLE\' | translate }} </div> </div>'),
    a.put("scripts/tools/export/export-partial.html", '<div class="tool export" ng-class="{ \'open\': ctl.isOpen }"> <div class="tool-tab" ng-click="ctl.toggle()"> <span class="glyphicon glyphicon-share" ng-if="ctl.isOpen || (!ctl.pending && !ctl.downloadURL)"></span> <cube-grid-spinner ng-if="!ctl.isOpen && ctl.pending"></cube-grid-spinner> <span class="glyphicon glyphicon-download-alt" ng-if="!ctl.isOpen && ctl.downloadURL && !ctl.pending"></span> {{ \'COMMON.EXPORT\' | translate }} </div> <div class="tool-content"> <div class="tool-body"> <div class="tool-item clickable" ng-click="ctl.showCustomReportsModal()"> <span class="glyphicon glyphicon-th-list"></span> {{ \'REPORT.TITLE\' | translate }} </div> <div class="tool-item" ng-class="{ \'clickable\': !ctl.pending }"> <div ng-if="!ctl.pending" ng-click="ctl.exportCSV()"> <span class="glyphicon glyphicon-export"></span> <span ng-if="!ctl.downloadURL">{{ \'COMMON.EXPORT_CSV\' | translate }}</span> <span ng-if="ctl.downloadURL">{{ \'COMMON.EXPORT_NEW_CSV\' | translate }}</span> </div> <div ng-if="ctl.pending"> <cube-grid-spinner></cube-grid-spinner> {{ \'COMMON.EXPORTING_CSV\' | translate }} </div> <div class="error" ng-if="ctl.error">{{ ctl.error }}</div> </div> <div class="tool-item" ng-if="ctl.downloadURL && !ctl.pending"> <span class="glyphicon glyphicon-download-alt"></span> <a href="{{ ctl.downloadURL }}" download>{{ \'COMMON.DOWNLOAD_CSV\' | translate }}</a> </div> </div> </div> </div>'),
    a.put("scripts/tools/interventions/interventions-partial.html", '<div class="tool interventions" ng-if="ctl.recordType" ng-class="{ \'open\': ctl.isOpen }"> <div class="tool-tab" ng-click="ctl.toggle()"> <span class="glyphicon glyphicon-map-marker" ng-if="ctl.isOpen || (!ctl.pending && !ctl.downloadURL)"></span> <cube-grid-spinner ng-if="!ctl.isOpen && ctl.pending"></cube-grid-spinner> <span class="glyphicon glyphicon-download-alt" ng-if="!ctl.isOpen && ctl.downloadURL && !ctl.pending"></span> {{ ctl.recordType.plural_label }} </div> <div class="tool-content"> <div class="tool-body"> <div class="tool-item"> <a ui-sref="record.addSecondary()"> <span class="glyphicon glyphicon-plus-sign"></span> {{ \'COMMON.ADD\' | translate }} {{ ctl.recordType.label }}</a> </div> <div class="tool-item" ng-class="{ \'clickable\': !ctl.pending }"> <div ng-if="!ctl.pending" ng-click="ctl.exportCSV()"> <span class="glyphicon glyphicon-export"></span> <span>{{ \'COMMON.EXPORT\' | translate }} {{ ctl.recordType.plural_label }}</span> </div> <div ng-if="ctl.pending"> <cube-grid-spinner></cube-grid-spinner> {{ \'COMMON.EXPORTING\' | translate }} {{ ctl.recordType.plural_label }} </div> <div class="error" ng-if="ctl.error">{{ ctl.error }}</div> </div> <div class="tool-item" ng-if="ctl.downloadURL && !ctl.pending"> <span class="glyphicon glyphicon-download-alt"></span> <a href="{{ ctl.downloadURL }}" download> {{ \'COMMON.DOWNLOAD_CSV\' | translate }} </a> </div> </div> </div> </div>'),
    a.put("scripts/tools/riskareas/riskareas-partial.html", '<div class="tool riskareas" ng-if="ctl.recordType" ng-class="{ \'open\': ctl.isOpen }"> <div class="tool-tab" ng-click="ctl.toggle()"> <span class="glyphicon glyphicon-alert"></span> Risk Zones </div> <div class="tool-content"> <div class="tool-header"> <h4>Risk Zones</h4> </div> <hr> <div class="tool-body"> <label># of Zones</label> <input type="text" class="form-control"> <label>Time of Day</label> <select class="form-control"> <option [ngStyle]="{'font-family':fontFamily}" >00:00�06:00</option> <option [ngStyle]="{'font-family':fontFamily}" >06:00�12:00</option> <option [ngStyle]="{'font-family':fontFamily}" >12:00�18:00</option> <option [ngStyle]="{'font-family':fontFamily}" >18:00�24:00</option> </select> <label>Date of Shift</label> <input type="text" class="form-control date-range-style"> </div> </div> </div>'),
    a.put("scripts/views/account/account-partial.html", '<div class="form-area no-filterbar acct-info"> <div class="col-sm-8 col-sm-offset-2"> <div class="form-area-heading"> <h2>{{ \'MANAGEMENT.ACCOUNT_INFORMATION\' | translate }}</h2> </div> <div class="well"> <div> <div class="row"> <div class="col-sm-2"><label>{{ \'MANAGEMENT.USER_ID\' | translate }}:</label></div> <div class="col-sm-4">{{ ::userInfo.id }}</div> </div> <div class="row"> <div class="col-sm-2"><label>{{ \'MANAGEMENT.EMAIL\' | translate }}:</label></div> <div class="col-sm-4">{{ ::userInfo.email }}</div> </div> <div class="row"> <div class="col-sm-2"><label>{{ \'MANAGEMENT.ADMINISTRATOR?\' | translate }}</label></div> <div class="col-sm-4"> <span ng-show="userInfo.isAdmin">{{ \'COMMON.YES\' | translate }}</span> <span ng-show="::!userInfo.isAdmin">{{ \'COMMON.NO\' | translate }}</span> </div> </div> <div class="row" ng-if="::userInfo.groups.length > 0"> <div class="col-sm-2"><label>{{ \'MANAGEMENT.GROUPS\' | translate }}:</label></div> <div class="col-sm-4"> <span>{{ ::userInfo.groups.join(\', \') }}</span> </div> </div> <div class="row"> <div class="col-sm-2"><label>{{ \'MANAGEMENT.TOKEN\' | translate }}:</label></div> <div class="col-sm-4">{{ ::userInfo.token }}</div> </div> </div> </div> </div> </div>'),
    a.put("scripts/views/dashboard/dashboard-partial.html", '<main class="dashboard no-filterbar" ng-if="isRightToLeft !== undefined"> <div ng-if="ctl.showBlackSpots"> <div class="block block-1x2 quick-map"> <div class="block-inner"> <div class="map" driver-black-spots leaflet-map zoom-to-boundary></div> <h3><span>{{ \'DASHBOARD.BLACK_SPOTS_BY_SEVERITY\' | translate }}</span> <a ui-sref="map" class="small pull-right"> {{ \'DASHBOARD.ANALYZE_AND_FILTER\' | translate }} » </a> </h3> </div> </div> <div class="block block-1x2 quick-map"> <div class="block-inner"> <div class="map" leaflet-map recent-events zoom-to-boundary></div> <h3><span>{{ ctl.recordType.plural_label }}: {{ \'DASHBOARD.RECENT_EVENTS_PERIOD\' | translate }}</span> <a ui-sref="map" class="small pull-right"> {{ \'DASHBOARD.VIEW_ALL\' | translate }} {{ ctl.recordType.plural_label | lowercase }} » </a> </h3> </div> </div> <div class="block block-1x1 costs" ng-if="ctl.showBlackSpots"> <driver-social-costs cost-data="ctl.socialCosts" as-tool="false"></driver-social-costs> </div> <div class="block block-1x1 counts"> <driver-recent-counts></driver-recent-counts> </div> <div class="block block-2x1 toddow"> <div class="block-inner"> <driver-toddow chart-data="ctl.toddow"></driver-toddow> <h3>{{ \'DASHBOARD.TODDOW_TITLE\' | translate }}</h3> </div> </div> <div class="block block-2x1 filters"> <driver-saved-filters compact="true"></driver-saved-filters> </div> </div> <div ng-if="!ctl.showBlackSpots" class="blackspots-disabled" ng-class="{\'right-to-left\': isRightToLeft}"> <div class="block block-1x2 quick-map"> <div class="block-inner"> <div class="map" leaflet-map recent-events zoom-to-boundary></div> <h3><span>{{ ctl.recordType.plural_label }}: {{ \'DASHBOARD.RECENT_EVENTS_PERIOD\' | translate }}</span> <a ui-sref="map" class="small pull-right"> {{ \'DASHBOARD.VIEW_ALL\' | translate }} {{ ctl.recordType.plural_label | lowercase }} » </a> </h3> </div> </div> <div class="block block-1x2 filters"> <driver-saved-filters compact="true"></driver-saved-filters> </div> <div class="block block-1x2 toddow"> <div class="block-inner"> <driver-toddow chart-data="ctl.toddow"></driver-toddow> <h3>{{ \'DASHBOARD.TODDOW_TITLE\' | translate }}</h3> </div> </div> <div class="block block-1x2 stepwise"> <div class="block-inner"> <driver-stepwise chart-data="ctl.stepwise" min-date="ctl.minDate" max-date="ctl.maxDate" in-dashboard="true"> </driver-stepwise> </div> </div> <div class="block block-1x1 counts"> <driver-recent-counts></driver-recent-counts> </div> <div class="block block-1x1 costs"> <driver-social-costs cost-data="ctl.socialCosts" as-tool="false"></driver-social-costs> </div> </div> </main>'),
    a.put("scripts/views/duplicates/duplicates-list-partial.html", '<div class="duplicates-title drop-shadow"><h3>{{ \'MANAGEMENT.POTENTIAL_DUPLICATES\' | translate }}</h3></div> <div class="table-view"> <div class="table-view-container"> <div class="overflow"> <table class="table"> <thead> <tr> <th class="date">{{ \'RECORD.DATE_AND_TIME\' | translate }}</th> <th class="detail">{{ \'RECORD.LOCATION\' | translate }}</th> <th class="date">{{ \'RECORD.DATE_AND_TIME\' | translate }}</th> <th class="detail">{{ \'RECORD.LOCATION\' | translate }}</th> <!-- Resolve link --> <th class="links"></th> </tr> </thead> <tbody> <tr ng-repeat="dup in ctl.duplicates.results"> <td ng-repeat-start="record in [dup.record, dup.duplicate_record]" class="date"> {{ ::record.occurred_to | localizeRecordDate: \'numeric\':\'time\' }} </td> <td ng-repeat-end class="detail"> {{ ::record.location_text }} </td> <td class="links"> <a ng-if="ctl.userCanWrite &amp;&amp; !dup.resolved" ng-click="ctl.showResolveModal(dup)"> <span class="glyphicon glyphicon-pencil"></span> {{ \'MANAGEMENT.RESOLVE\' | translate }} </a> </td> </tr> </tbody> </table> <nav> <ul class="pager"> <li class="previous" ng-if="ctl.duplicates.previous"> <a type="button" class="btn btn-default" ng-click="ctl.getPreviousDuplicates()"> <span aria-hidden="true">&larr;</span> {{ \'COMMON.PREVIOUS\' | translate }}</a> </li> <li ng-if="ctl.duplicates.count" class="text-center"> <i> {{ \'RECORD.SHOWING_RESULTS\' | translate }} {{ ctl.currentOffset + 1}} - {{ ctl.currentOffset + ctl.duplicates.results.length }} {{ \'COMMON.OF\' | translate }} {{ ctl.duplicates.count }} </i> </li> <li class="next" ng-if="ctl.duplicates.next"> <a type="button" class="btn btn-default" ng-click="ctl.getNextDuplicates()"> {{ \'COMMON.NEXT\' | translate }} <span aria-hidden="true">&rarr;</span></a> </li> </ul> </nav> </div> </div> </div>'),
    a.put("scripts/views/duplicates/resolve-duplicate-confirmation-modal-partial.html", '<div class="confirmation-modal"> <div class="modal-body"> {{ \'MANAGEMENT.REALLY_ARCHIVE\' | translate }} {{ \'MANAGEMENT.ARCHIVE_NOTE\' | translate }} </div> <div class="modal-footer"> <div class="select confirm" ng-click="$close()">{{ \'COMMON.YES\' | translate }}</div> <div class="select dismiss" ng-click="$dismiss(\'cancel\')">{{ \'COMMON.NO\' | translate }}</div> </div> </div>'),
    a.put("scripts/views/duplicates/resolve-duplicate-modal-partial.html", '<div class="duplicate-modal"> <div class="close" ng-click="modal.dismiss()"> &times; </div> <div class="modal-header"> <h3>{{ \'MANAGEMENT.RESOLVE_DUPLICATE_ENTRIES\' | translate }}</h3> </div> <div class="modal-body"> <div class="duplicate-details" ng-repeat="record in [modal.params.duplicate.record, modal.params.duplicate.duplicate_record]"> <driver-details-tabs record-schema="modal.params.recordSchema" record="record" user-can-write="false"> </driver-details-tabs> </div> </div> <div class="modal-footer"> <div class="select-record" ng-click="modal.selectRecord(modal.params.duplicate.record.uuid)"> {{ \'MANAGEMENT.USE_THIS_RECORD\' | translate }} </div> <div class="select-record" ng-click="modal.selectRecord(modal.params.duplicate.duplicate_record.uuid)"> {{ \'MANAGEMENT.USE_THIS_RECORD\' | translate }} </div> <div class="keep-both" ng-click="modal.keepBoth()"> {{ \'MANAGEMENT.KEEP_BOTH_RECORDS\' | translate }} </div> </div> </div>'),
    a.put("scripts/views/login/login-partial.html", '<div class="login-view"> <div class="login-panel"> <section class="sso active text-center"> <form ng-submit="authenticate()" autocomplete="off"> <h6>{{ \'COMMON.APP_BRAND\' | translate }}</h6> <h1>{{ \'LOGIN.LOG_IN_TO_DRIVER\' | translate }}</h1> <hr class="divider"> <div class="form-group" ng-class="{true: \'login-field-error\', false: \'\'}[auth.failure]"> <label for="username" class="text-right-on-rtl">{{ \'LOGIN.USERNAME\' | translate }}:</label> <input type="text" id="username" class="form-control" ng-model="auth.username"> </div> <div class="form-group" ng-class="{true: \'login-field-error\', false: \'\'}[auth.failure]"> <label for="password" class="text-right-on-rtl">{{ \'LOGIN.PASSWORD\' | translate }}:</label> <input type="password" id="password" class="form-control" ng-model="auth.password"> </div> <button type="submit" class="btn btn-default btn-lg"> {{ \'LOGIN.SIGN_IN\' | translate }} </button> <hr ng-if="ssoClients && ssoClients.length"> <div class="row" ng-repeat="client in ssoClients"> <div class="col-12 loginmodal-field"> <a type="button" class="btn btn-default btn-lg" ng-click="sso(client)">{{ \'LOGIN.LOG_IN_WITH\' | translate }} {{ client }}</a> </div> </div> </form> <alert ng-repeat="alert in alerts" type="alert.type">{{alert.msg}}</alert> </section> </div> </div>'),
    a.put("scripts/views/map/map-partial.html", '<main class="map-view"> <div class="records-map" leaflet-map driver-map-layers zoom-to-boundary zoom-to-address></div> <div class="tools"> <driver-charts stepwise="ctl.stepwise" min-date="ctl.minDate" max-date="ctl.maxDate" toddow="ctl.toddow"> </driver-charts> <driver-interventions ng-if="ctl.userCanWrite && ctl.showInterventions" params="ctl.recordQueryParams"> </driver-interventions> <driver-export params="ctl.recordQueryParams"></driver-export> <enforcers-tool params="ctl.recordQueryParams" ng-if="ctl.showBlackSpots"></enforcers-tool> <driver-social-costs cost-data="ctl.socialCosts" as-tool="true"></driver-social-costs> </div> </main>'),
    a.put("scripts/views/record/add-edit-partial.html", '<div class="json-editor-form form-area no-filterbar" ng-if="ctl.userCanWrite && !ctl.error"> <div class="col-sm-8 col-sm-offset-2"> <div class="form-area-heading"> <h2>{{ ::ctl.recordType.label }} {{ \'RECORD.INPUT_FORM\' | translate }}</h2> <div class="content-border"></div> </div> <div class="row"> <div class="col-sm-9" ng-class="{ \'col-sm-push-3\': isRightToLeft }"> <ase-notifications></ase-notifications> <div class="constant-fields"> <div class="well"> <h3>{{ ::ctl.recordType.label }} {{ \'RECORD.LOCATION_AND_TIME\' | translate }}</h3> <div class="row"> <div class="col-md-12"> <div class="form-group"> <label class="control-label">{{ \'RECORD.LOCATION\' | translate }}</label> <input type="text" class="form-control" typeahead="result.display_name for result in ctl.nominatimLookup($viewValue)" typeahead-on-select="ctl.nominatimSelect($item)" typeahead-wait-ms="250" ng-model="ctl.nominatimLocationText"> </div> </div> <div class="col-md-12"> <div class="map" leaflet-map driver-embed-map editable="true"></div> </div> </div> <div class="row"> <div class="col-md-6"> <div class="form-group" ng-class="ctl.constantFieldErrors.latitude ? \'has-error\' : \'\'"> <label class="control-label required">{{ \'RECORD.LATITUDE\' | translate }}</label> <input type="number" class="form-control" ng-change="ctl.onGeomChanged(false)" ng-model="ctl.geom.lat"> <p ng-if="ctl.constantFieldErrors.latitude" class="help-block errormsg">{{ \'ERRORS.VALUE_REQUIRED\' | translate }}.</p> </div> </div> <div class="col-md-6"> <div class="form-group" ng-class="ctl.constantFieldErrors.longitude ? \'has-error\' : \'\'"> <label class="control-label required">{{ \'RECORD.LONGITUDE\' | translate }}</label> <input type="number" class="form-control" ng-change="ctl.onGeomChanged(false)" ng-model="ctl.geom.lng"> <p ng-if="ctl.constantFieldErrors.longitude" class="help-block errormsg">{{ \'ERRORS.VALUE_REQUIRED\' | translate }}.</p> </div> </div> </div> <div class="row"> <div class="col-md-6"> <div class="form-group date-picker" ng-class="ctl.constantFieldErrors.occurred ? \'has-error\' : \'\'"> <label class="control-label required" ng-if="ctl.isSecondary"> {{ \'RECORD.OCCURRED_FROM\' | translate }} </label> <label class="control-label required" ng-if="!ctl.isSecondary"> {{ \'RECORD.OCCURRED\' | translate }} </label> <div class="input-group"> <az-date-picker id="occurred-from-datepicker" datetime="ctl.occurredFromDate" on-change="ctl.combineOccurredFromDateAndTime()" placeholder="{{ \'COMMON.FROM\' | translate }}"> </az-date-picker> </div> <p ng-if="ctl.constantFieldErrors.occurred" class="help-block errormsg">{{ctl.constantFieldErrors.occurred}}</p> </div> </div> <div class="col-md-6"> <div class="form-group time-picker"> <timepicker class="input-group" ng-model="ctl.occurredFromTime" show-meridian="false" ng-change="ctl.combineOccurredFromDateAndTime()"> </timepicker> </div> </div> </div> <div class="row" ng-if="ctl.isSecondary"> <div class="col-md-6"> <div class="form-group date-picker" ng-class="ctl.constantFieldErrors.occurredTo ? \'has-error\' : \'\'"> <label class="control-label">{{ \'RECORD.OCCURRED_TO\' | translate }}</label> <div class="input-group"> <az-date-picker id="occurred-to-datepicker" datetime="ctl.occurredToDate" on-change="ctl.combineOccurredToDateAndTime()" placeholder="{{ \'COMMON.TO\' | translate }}"> </az-date-picker> </div> <p ng-if="ctl.constantFieldErrors.occurredTo" class="help-block errormsg">{{ctl.constantFieldErrors.occurredTo}}</p> </div> </div> <div class="col-md-6"> <div class="form-group time-picker"> <div class="input-group" timepicker ng-model="ctl.occurredToTime" ng-change="ctl.combineOccurredToDateAndTime()"> </div> </div> </div> </div> <div class="row" ng-if="!ctl.isSecondary"> <div class="col-md-6"> <label class="control-label">{{ \'RECORD.Weather\' | translate }}</label> <div class="input-group"> <select class="form-control" ng-model="ctl.weather"> <option [ngStyle]="{'font-family':fontFamily}"  ng-repeat="weatherVal in ctl.weatherValues" value="{{ weatherVal }}"> {{ weatherVal | weatherLabel | translate }} </option> </select> <span class="input-group-addon"> <i class="wi wi-forecast-io-{{ ctl.weather }}"></i> </span> </div> <a href="https://forecast.io" ng-if="ctl.record.weather" target="_blank"> {{ \'RECORD.POWERED_BY_FORECAST\' | translate }} </a> </div> <div class="col-md-6"> <label class="control-label">{{ \'RECORD.LIGHT\' | translate }}</label> <select class="form-control" ng-model="ctl.light"> <option [ngStyle]="{'font-family':fontFamily}"  ng-repeat="lightVal in ctl.lightValues" value="{{ lightVal }}"> {{ lightVal | weatherLabel | translate }} </option> </select> </div> </div> </div> </div> <json-editor editor-id="{{ ctl.editor.id }}" options="ctl.editor.options" on-data-change="ctl.onDataChange" class="form-area-body"> </json-editor> </div> <div class="col-sm-3" ng-class="{ \'col-sm-pull-9\': isRightToLeft }"> <div class="save-area"> <button type="button" class="btn btn-primary btn-block" ng-disabled="ctl.editor.errors.length > 0 || ctl.constantFieldErrors" ng-click="ctl.onSaveClicked()"> {{ \'COMMON.SAVE\' | translate }} {{ ::ctl.recordType.label }} </button> <button type="button" class="btn btn-warning btn-block" ng-if="ctl.record" ng-click="ctl.onDeleteClicked()"> {{ \'COMMON.DELETE\' | translate }} {{ ::ctl.recordType.label }} </button> <button type="button" class="btn btn-default btn-block" ng-click="ctl.goBack()"> {{ \'COMMON.CANCEL\' | translate }} </button> </div> </div> </div> </div> </div>  <div class="form-area no-filterbar" ng-if="::!ctl.userCanWrite"> <!-- Shouldn\'t get here, but have a message to display, just in case --> <h2>{{ \'ERRORS.NO_ACCESS\' | translate }}</h2> </div> <div class="form-area no-filterbar" ng-if="::ctl.error"> <!-- Shouldn\'t get here, but have a message to display, just in case --> <h2>{{ctl.error}}</h2> </div>'),
    a.put("scripts/views/record/details-modal-partial.html", '<div class="incident-report modal-content"> <div class="modal-content"> <div class="close" ng-click="modal.close()"> &times; </div> <div class="report-header"> <h3 class="modal-title"> <small ng-if="modal.userCanWrite" class="pull-right"> <a ui-sref="record.edit({ recorduuid: modal.record.uuid })" target="_blank"> <span class="glyphicon glyphicon-share"></span> {{ \'COMMON.EDIT\' | translate }} </a> </small> <small class="pull-right"> <a ui-sref="record.details({ recorduuid: modal.record.uuid })" target="_blank"> <span class="glyphicon glyphicon-share"></span> {{ \'COMMON.VIEW\' | translate }} </a> </small> {{ modal.recordType.label }} {{ \'RECORD.DETAILS\' | translate }} </h3> </div> <driver-details-tabs class="modal-body" record-schema="modal.recordSchema" record="modal.record" user-can-write="modal.userCanWrite" is-secondary="modal.isSecondary"> </driver-details-tabs> <div class="modal-footer"> <button class="btn btn-primary" ng-click="modal.close()"> {{ \'COMMON.CLOSE\' | translate }} </button> </div> </div> </div>'),
    a.put("scripts/views/record/details-partial.html", '<div class="form-area no-filterbar"> <div class="col-sm-8 col-sm-offset-2"> <ase-notifications></ase-notifications> <div class="form-area-heading"> <h2>{{ ::ctl.recordType.label }} {{ \'RECORD.DETAILS\' | translate }}</h2> <div class="content-border"></div> <driver-details-tabs record-schema="ctl.recordSchema" record="ctl.record" ng-if="ctl.record && ctl.recordSchema"> </driver-details-tabs> </div> </div> </div>'),
    a.put("scripts/views/record/list-partial.html", '<div class="table-view"> <div class="table-view-container"> <div class="overflow"> <table class="table"> <thead> <tr> <th>{{ \'RECORD.DATE_AND_TIME\' | translate }}</th> <th ng-repeat="headerKey in ctl.headerKeys | limitTo : ctl.maxDataColumns"> {{ ::headerKey }} </th> <th ng-if="ctl.userCanWrite">{{ \'RECORD.CREATED_BY\' | translate }}</th> <!-- View/Edit links --> <th></th> </tr> </thead> <tbody> <div class="loadingrecords" ng-if="ctl.loadingRecords"> <fading-circle-spinner></fading-circle-spinner> </div> <tr ng-if="!ctl.loadingRecords" ng-repeat="record in ctl.records.results"> <td class="date"> {{ ::record.occurred_to | localizeRecordDate: \'numeric\':\'time\' }} </td> <td class="detail" ng-repeat="headerKey in ctl.headerKeys | limitTo : ctl.maxDataColumns"> <driver-details-field compact="true" data="::record.data[ctl.detailsPropertyKey][headerKey]" record="::record" property="::ctl.recordSchema.schema.definitions[ctl.detailsPropertyKey].properties[headerKey]"> </driver-details-field> </td> <td ng-if="ctl.userCanWrite" class="created_by"> {{ ::record.created_by }} </td> <td class="links"> <a ng-click="ctl.showDetailsModal(record)"> <span class="glyphicon glyphicon-log-in"></span> {{ \'COMMON.VIEW\' | translate }} </a> <a ng-if="::ctl.userCanWrite" ui-sref="record.edit({ rtuuid: ctl.recordType.uuid, recorduuid: record.uuid })"> <span class="glyphicon glyphicon-pencil"></span> {{ \'COMMON.EDIT\' | translate }} </a> </td> </tr> </tbody> </table> <nav> <ul class="pager" ng-if="!ctl.loadingRecords"> <li class="previous" ng-if="ctl.records.previous"> <a type="button" class="btn btn-default" ng-click="ctl.getPreviousRecords()"> <span aria-hidden="true">&larr;</span> {{ \'COMMON.PREVIOUS\' | translate }}</a> </li> <li ng-if="ctl.records.count" class="text-center"> <i> {{ \'RECORD.SHOWING_RESULTS\' | translate }} {{ ctl.currentOffset + 1}} - {{ ctl.currentOffset + ctl.records.results.length }} {{ \'COMMON.OF\' | translate }} {{ ctl.records.count }} </i> </li> <li class="next" ng-if="ctl.records.next"> <a type="button" class="btn btn-default" ng-click="ctl.getNextRecords()"> {{ \'COMMON.NEXT\' | translate }} <span aria-hidden="true">&rarr;</span></a> </li> </ul> </nav> </div> </div> </div>')
}
]);
