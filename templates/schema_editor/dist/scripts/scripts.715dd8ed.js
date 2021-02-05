!function() {
    "use strict";
    angular.module("ase.utils", [])
}(),
function() {
    "use strict";
    function a() {
        function a(a) {
            var b = "";
            return a.data && (b += "<ul>",
            angular.forEach(a.data, function(a, c) {
                b += "<li>" + c + ":",
                a.length && (b += "<ul>",
                a.forEach(function(a) {
                    b += "<li>" + a + "</li>"
                }),
                b += "</ul>"),
                b += "</ul>"
            })),
            b
        }
        var b = {
            buildErrorHtml: a
        };
        return b
    }
    angular.module("ase.utils").factory("Utils", a)
}(),
function() {
    "use strict";
    angular.module("ase.directives", [])
}(),
function() {
    "use strict";
    function a(a) {
        function b(b, c, d) {
            c.bind("click", function() {
                a.confirm("Are you sure?") && b.$eval(d.aseConfirmClick)
            })
        }
        var c = {
            restrict: "A",
            link: b
        };
        return c
    }
    a.$inject = ["$window"],
    angular.module("ase.directives").directive("aseConfirmClick", a)
}(),
function() {
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
        function g(a, b) {
            i = b;
            var d = c.defer();
            return k.User.queryWithTmpHeader({
                id: a
            }, function(a) {
                h(a) ? d.resolve(!0) : d.resolve(!1),
                i = ""
            }),
            d.promise
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
        m.captcha = function() {
            var a = b.defer();
            return c.get(h.api.hostname + "/signup").success(function(b) {
                var c = b.match(/\/captcha\/image\/(.*?)\//);
                a.resolve({
                    captchaUrl: h.api.hostname + c[0],
                    value: c[1]
                })
            }),
            a.promise
        }
        ,
        m.create = function(a) {
            var d = b.defer();
            return c.post(h.api.hostname + "/api/create-user/", a).success(function(b, c) {
                a.username = a.email,
                d.resolve({
                    isAuthenticated: !1,
                    status: c
                })
            }).error(function(a, b) {
                var c = _.values(a).join(" ")
                  , e = {
                    isAuthenticated: !1,
                    status: b,
                    error: c
                };
                d.resolve(e)
            }),
            d.promise
        }
        ,
        m.reset = function(a) {
            var d = b.defer()
              , e = new window.URLSearchParams;
            for (var f in a)
                e.set(f, a[f]);
            return c({
                method: "POST",
                url: h.api.hostname + "/password_reset/",
                data: e.toString(),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
                }
            }).success(function(a, b) {
                d.resolve({
                    data: a,
                    status: b
                })
            }).error(function(a, b) {
                var c = _.values(a).join(" ")
                  , e = {
                    isAuthenticated: !1,
                    status: b,
                    error: c
                };
                d.resolve(e)
            }),
            d.promise
        }
        ,
        m.getCsrf = function() {
            c.get(h.api.hostname + "/password_reset/").success(function(a) {
                d.put("csrftoken", a.match(/csrfmiddlewaretoken' value='(.*?)'/).pop())
            })
        }
        ,
        m.authenticate = function(d, f, g) {
            var n;
            return n = g ? g : b.defer(),
            c.post(h.api.hostname + "/api-token-auth/", d).success(function(b, c) {
                var d = {
                    status: c,
                    error: ""
                };
                b && b.user && b.token || (d.isAuthenticated = !1,
                d.error = "Error obtaining user information.",
                n.resolve(d)),
                i.isAdmin(b.user, b.token).then(function(c) {
                    f ? c ? (l(b.user),
                    k(b.token),
                    d.isAuthenticated = m.isAuthenticated(),
                    d.isAuthenticated ? j(!0, c).then(function() {
                        e.$broadcast(t.loggedIn),
                        n.resolve(d)
                    }) : (d.error = "Unknown error logging in.",
                    n.resolve(d))) : (a.debug("user service sent back:"),
                    a.debug(c),
                    d.isAuthenticated = !1,
                    d.error = "Must be an administrator to access this portion of the site.",
                    n.resolve(d)) : (l(b.user),
                    k(b.token),
                    d.isAuthenticated = m.isAuthenticated(),
                    d.isAuthenticated ? i.canWriteRecords(b.user, b.token).then(function(a) {
                        j(a, c).then(function() {
                            e.$broadcast(t.loggedIn),
                            n.resolve(d)
                        })
                    }) : (d.error = "Unknown error logging in.",
                    j(!1, !1),
                    n.resolve(d)))
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
                n.resolve(d)
            }),
            n.promise
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
    function a(a) {
        a.defaults.stripTrailingSlashes = !1
    }
    a.$inject = ["$resourceProvider"],
    angular.module("ase.resources", ["ngResource", "ase.config", "ngFileUpload"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b) {
        var c = b.api.hostname + "/api/blackspotconfig/:id/";
        return a(c, {
            id: "@uuid",
            limit: "all"
        }, {
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
    angular.module("ase.resources").factory("BlackSpotConfig", a)
}(),
function() {
    "use strict";
    function a(a) {
        return a("/static/builder-schemas/:name.json", {
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
            limit: "all",
            format: "json"
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
    function a(a, b) {
        var c = b.api.hostname + "/api/recordcosts/:id/";
        return a(c, {
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
            }
        })
    }
    a.$inject = ["$resource", "ASEConfig"],
    angular.module("ase.resources").factory("RecordCosts", a)
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
            templateUrl: "/static/scripts/notifications/notifications-partial.html",
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
    angular.module("ase.navbar", ["ase.auth", "ui.bootstrap", "ui.router"])
}(),
function() {
    "use strict";
    function a(a, b, c, d) {
        var e = this;
        e.onLogoutButtonClicked = d.logout,
        e.authenticated = d.isAuthenticated(),
        a.$on("$stateChangeSuccess", function() {
            e.authenticated = d.isAuthenticated()
        })
    }
    a.$inject = ["$rootScope", "$scope", "$state", "AuthService"],
    angular.module("ase.navbar").controller("ASENavbarController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/navbar/navbar-partial.html",
            controller: "ASENavbarController",
            controllerAs: "ctl",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.navbar").directive("aseNavbar", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("sidebar", {
            "abstract": !0,
            url: "",
            template: "<ase-sidebar></ase-sidebar>"
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("ase.views.sidebar", ["ui.router", "ase.views.recordtype"]).config(a)
}(),
function() {
    "use strict";
    function a(a) {
        function b(b, c) {
            c.click(function(b) {
                b.stopPropagation ? b.stopPropagation() : (a.debug("Used cancelBubble in cancel-bubble directive"),
                b.cancelBubble = !0)
            })
        }
        var c = {
            restrict: "A",
            link: b
        };
        return c
    }
    a.$inject = ["$log"],
    angular.module("ase.views.sidebar").directive("cancelBubble", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        function c() {
            d(),
            a.$on("ase.recordtypes.changed", d)
        }
        function d() {
            e.recordTypes = b.query({
                active: "True"
            })
        }
        var e = this;
        c()
    }
    a.$inject = ["$scope", "RecordTypes"],
    angular.module("ase.views.sidebar").controller("SidebarController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/sidebar/sidebar-partial.html",
            controller: "SidebarController",
            controllerAs: "sb",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.sidebar").directive("aseSidebar", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("geo", {
            "abstract": !0,
            parent: "sidebar",
            url: "/geography",
            template: "<ui-view></ui-view>"
        }),
        a.state("geo.list", {
            url: "",
            template: "<ase-geo-list></ase-geo-list>"
        }),
        a.state("geo.add", {
            url: "/add",
            template: "<ase-geo-add></ase-geo-add>"
        }),
        a.state("geo.edit", {
            url: "/edit/:uuid",
            template: "<ase-geo-edit></ase-geo-edit>"
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("ase.views.geography", ["ui.router", "ase.config", "ase.directives", "ngFileUpload", "ase.notifications", "ase.views.sidebar", "ase.resources"]).config(a)
}(),
function() {
    "use strict";
    function a(a) {
        function b() {
            c.geographies = a.query()
        }
        var c = this;
        b(),
        c.noFailures = function() {
            return function(a) {
                return "COMPLETE" === a.status ? !0 : !1
            }
        }
        ,
        c.deleteGeo = function(b) {
            var d = a.remove({
                uuid: b
            });
            d.$promise.then(function() {
                c.geographies = _.filter(c.geographies, function(a) {
                    return a.uuid !== b
                })
            })
        }
    }
    a.$inject = ["Geography"],
    angular.module("ase.views.geography").controller("GeoListController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/geography/list-partial.html",
            controller: "GeoListController",
            controllerAs: "geoList",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.geography").directive("aseGeoList", a)
}(),
function() {
    "use strict";
    function a(a, b) {
        function c() {
            d.colors = ["red", "blue", "green"],
            d.workingGeo = b.get({
                uuid: a.uuid
            })
        }
        var d = this;
        c(),
        d.geoUpdate = function() {
            delete d.workingGeo.source_file;
            var a = new b(d.workingGeo)
              , c = a.$update();
            d.updateState = "requesting",
            c.then(function(a) {
                d.updateState = "update-success",
                d.serverSays = a
            }, function(a) {
                d.updateState = "update-error",
                d.errorMessage = b.errorMessage(a.status)
            })
        }
    }
    a.$inject = ["$stateParams", "Geography"],
    angular.module("ase.views.geography").controller("GeoEditController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/geography/edit-partial.html",
            controller: "GeoEditController",
            controllerAs: "geoEdit",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.geography").directive("aseGeoEdit", a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        function d(a, d) {
            f.uploadState = "upload-error",
            c.show({
                text: b.errorMessage(d),
                displayClass: "alert-danger"
            })
        }
        function e() {
            f.fileUploaded = !1,
            f.uploadState = "",
            c.show({
                text: "Upload your zipped shapefile; once uploaded, select a primary field for display",
                displayClass: "alert-info"
            }),
            f.files = [],
            f.colors = ["red", "blue", "green"]
        }
        var f = this;
        e(),
        f.geoUpload = function() {
            function a(a) {
                "COMPLETE" === a.status ? (f.serverGeoFields = a,
                f.fileUploaded = !0,
                f.uploadState = "upload-success",
                c.show({
                    text: "Geography upload successful! Select a primary field below.",
                    displayClass: "alert-success"
                }),
                f.fields = a.data_fields) : "ERROR" === a.status && (f.uploadState = "upload-error",
                c.show({
                    text: "Error - check that your upload is a valid shapefile",
                    displayClass: "alert-danger"
                }))
            }
            f.uploadState = "requesting",
            c.show({
                text: "Loading..."
            }),
            b.create(f.files, f.geoFields.label, f.geoFields.color, a, d)
        }
        ,
        f.geoUpdate = function() {
            var a = angular.extend(f.serverGeoFields, f.geoFields);
            delete a.source_file;
            var e = new b(a)
              , g = e.$update();
            f.uploadState = "requesting",
            c.show({
                text: "Loading..."
            }),
            g.then(function(a) {
                f.uploadState = "update-success",
                c.show({
                    text: "Geography update successful!",
                    displayClass: "alert-success"
                }),
                f.serverSays = a
            }, d)
        }
        ,
        f.cancel = function() {
            if (f.serverGeoFiels) {
                var c = b.remove({
                    uuid: f.serverGeoFields.uuid
                });
                c.$promise.then(function() {
                    a.go(a.$current, null, {
                        reload: !0
                    })
                })
            } else
                a.go(a.$current, null, {
                    reload: !0
                })
        }
    }
    a.$inject = ["$state", "Geography", "Notifications"],
    angular.module("ase.views.geography").controller("GeoAddController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/geography/add-partial.html",
            controller: "GeoAddController",
            controllerAs: "geoAdd",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.geography").directive("aseGeoAdd", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("login", {
            url: "/login",
            templateUrl: "/static/scripts/views/login/login-partial.html",
            controller: "AuthController",
            resolve: {
                SSOClients: ["$log", "$http", "$q", "ASEConfig", function(a, b, c, d) {
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
            }
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("ase.views.login", ["ui.router", "ase.auth"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f) {
        a.auth = {},
        a.ssoClients = e,
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
            a.authenticated = d.authenticate(a.auth, !0),
            a.authenticated.then(function(a) {
                a.isAuthenticated ? c.location.href = "/editor/" : g(a)
            }, function(a) {
                g(a)
            })
        }
        ,
        a.sso = function(a) {
            c.location.href = [f.api.hostname, "/openid/openid/", a, "?next=/editor/"].join("")
        }
        ;
        var g = function(b) {
            a.auth.failure = !0;
            var c = b.error || b.status + ": Unknown Error.";
            a.addAlert({
                type: "danger",
                msg: c
            })
        }
    }
    a.$inject = ["$scope", "$state", "$window", "AuthService", "SSOClients", "ASEConfig"],
    angular.module("ase.views.login").controller("AuthController", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("rt", {
            "abstract": !0,
            parent: "sidebar",
            url: "/recordtype",
            template: "<ui-view></ui-view>"
        }),
        a.state("rt.list", {
            url: "",
            template: "<ase-rt-list></ase-rt-list>"
        }),
        a.state("rt.add", {
            url: "/add",
            template: "<ase-rt-add></ase-rt-add>"
        }),
        a.state("rt.edit", {
            url: "/edit/:uuid",
            template: "<ase-rt-edit></ase-rt-edit>"
        }),
        a.state("rt.preview", {
            url: "/preview/:uuid",
            template: "<ase-rt-preview></ase-rt-preview>"
        }),
        a.state("rt.related", {
            url: "/related/:uuid",
            template: "<ase-rt-related></ase-rt-related>"
        }),
        a.state("rt.related-edit", {
            url: "/related/:uuid/edit/:schema",
            template: "<ase-rt-related-edit></ase-rt-related-edit>"
        }),
        a.state("rt.related-add", {
            url: "/related/:uuid/add",
            template: "<ase-rt-related-add></ase-rt-related-add>"
        }),
        a.state("rt.schema-edit", {
            url: "/related/:uuid/schema/:schema",
            template: "<ase-rt-schema-edit></ase-rt-schema-edit>"
        }),
        a.state("rt.related-aggregates", {
            url: "/related/:uuid/aggregates",
            template: "<ase-rt-related-aggregates></ase-rt-related-aggregates>"
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("ase.views.recordtype", ["ui.router", "ui.bootstrap", "json-editor", "ase.config", "ase.directives", "ase.notifications", "ase.schemas", "ase.resources"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        function d() {
            g.deactivateRecordType = f,
            e(),
            b.$on("ase.recordtypes.changed", e)
        }
        function e() {
            g.recordTypes = c.query({
                active: "True"
            })
        }
        function f(d) {
            c.update({
                uuid: d.uuid,
                active: !1
            }, function() {
                b.$emit("ase.recordtypes.changed")
            }, function(b) {
                a.debug("Error while deleting recordType: ", b)
            })
        }
        var g = this;
        d()
    }
    a.$inject = ["$log", "$scope", "RecordTypes"],
    angular.module("ase.views.recordtype").controller("RTListController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/recordtype/list-partial.html",
            controller: "RTListController",
            controllerAs: "rtList",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.recordtype").directive("aseRtList", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f) {
        function g() {
            j.recordType = {},
            j.submitForm = h
        }
        function h() {
            e.create(j.recordType, i, function(b) {
                a.debug("Error while adding recordType: ", b)
            })
        }
        function i(e) {
            b.$emit("ase.recordtypes.changed");
            var g = f.JsonObject();
            g = f.addVersion4Declaration(g);
            var h = f.JsonObject();
            h.details = !0,
            h.description = "Details for " + e.label,
            h.multiple = !1,
            h.propertyOrder = 0,
            h.title = h.plural_title = e.label + " Details";
            var i = f.generateFieldName(h.title);
            g.definitions[i] = h,
            g.properties[i] = {
                $ref: "#/definitions/" + encodeURIComponent(i),
                options: {
                    collapsed: !0
                }
            },
            d.create({
                record_type: e.uuid,
                schema: g
            }).$promise.then(function() {
                c.go("rt.list")
            }, function(b) {
                a.debug("Error while creating recordschema:", b)
            })
        }
        var j = this;
        g()
    }
    a.$inject = ["$log", "$scope", "$state", "RecordSchemas", "RecordTypes", "Schemas"],
    angular.module("ase.views.recordtype").controller("RTAddController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/recordtype/add-edit-partial.html",
            controller: "RTAddController",
            controllerAs: "rt",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.recordtype").directive("aseRtAdd", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f() {
            h.recordType = e.get({
                id: d.uuid
            }),
            h.submitForm = g
        }
        function g() {
            e.update(h.recordType, function() {
                b.$emit("ase.recordtypes.changed"),
                c.go("rt.list")
            }, function(b) {
                a.debug("Error while editing recordType: ", b)
            })
        }
        var h = this;
        f()
    }
    a.$inject = ["$log", "$scope", "$state", "$stateParams", "RecordTypes"],
    angular.module("ase.views.recordtype").controller("RTEditController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/recordtype/add-edit-partial.html",
            controller: "RTEditController",
            controllerAs: "rt",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.recordtype").directive("aseRtEdit", a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        function d() {
            e().then(f).then(g)
        }
        function e() {
            return b.get({
                id: a.uuid
            }).$promise.then(function(a) {
                h.recordType = a
            })
        }
        function f() {
            var a = h.recordType.current_schema;
            return c.get({
                id: a
            }).$promise.then(function(a) {
                h.recordSchema = a
            })
        }
        function g() {
            h.editor = {
                id: "preview-editor",
                options: {
                    schema: h.recordSchema.schema,
                    disable_edit_json: !0,
                    disable_properties: !0,
                    disable_array_add: !1,
                    theme: "bootstrap3",
                    show_errors: "change",
                    no_additional_properties: !0
                },
                errors: []
            }
        }
        var h = this;
        h.onDataChange = angular.noop,
        d()
    }
    a.$inject = ["$stateParams", "RecordTypes", "RecordSchemas"],
    angular.module("ase.views.recordtype").controller("RTPreviewController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/recordtype/preview-partial.html",
            controller: "RTPreviewController",
            controllerAs: "rtPreview",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.recordtype").directive("aseRtPreview", a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        function d() {
            c.get({
                id: a.uuid
            }).$promise.then(function(a) {
                f.recordType = a,
                f.currentSchema = b.get({
                    id: f.recordType.current_schema
                })
            })
        }
        function e(a) {
            f.currentSchema.schema.definitions[a] && (delete f.currentSchema.schema.definitions[a],
            delete f.currentSchema.schema.properties[a],
            b.create({
                record_type: f.recordType.uuid,
                schema: f.currentSchema.schema
            }))
        }
        var f = this;
        f.deleteSchema = e,
        d()
    }
    a.$inject = ["$stateParams", "RecordSchemas", "RecordTypes"],
    angular.module("ase.views.recordtype").controller("RTRelatedController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/recordtype/related-partial.html",
            controller: "RTRelatedController",
            controllerAs: "rt",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.recordtype").directive("aseRtRelated", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f) {
        function g() {
            j.definition = f.JsonObject(),
            j.definition = f.addRelatedContentFields(j.definition),
            e.get({
                id: c.uuid
            }).$promise.then(function(a) {
                j.recordType = a,
                j.currentSchema = d.get({
                    id: j.recordType.current_schema
                })
            })
        }
        function h(a) {
            var b = 0;
            _.mapValues(a, function(a) {
                var c = a.propertyOrder;
                c && c > b && (b = c)
            }),
            _.forEach(a, function(a) {
                a.propertyOrder || 0 === a.propertyOrder || (b += 1,
                a.propertyOrder = b)
            })
        }
        function i() {
            var c = f.generateFieldName(j.definition.title);
            if (j.currentSchema.schema.definitions[c])
                return void a.debug("Title", c, "exists for current schema");
            j.currentSchema.schema.definitions[c] = j.definition;
            var e = "#/definitions/" + encodeURIComponent(c);
            j.definition.multiple ? j.currentSchema.schema.properties[c] = {
                type: "array",
                items: {
                    $ref: e
                },
                title: j.definition.title,
                plural_title: j.definition.plural_title
            } : j.currentSchema.schema.properties[c] = {
                $ref: e
            },
            j.currentSchema.schema.properties[c].options = {
                collapsed: !0
            },
            h(j.currentSchema.schema.properties),
            d.create({
                schema: j.currentSchema.schema,
                record_type: j.recordType.uuid
            }, function() {
                b.go("rt.related", {
                    uuid: j.recordType.uuid
                })
            }, function(b) {
                a.debug("Error saving new schema: ", b)
            })
        }
        var j = this;
        j.submitForm = i,
        g()
    }
    function b() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/recordtype/related-add-edit-partial.html",
            controller: "RTRelatedAddController",
            controllerAs: "rtRelated",
            bindToController: !0
        };
        return a
    }
    a.$inject = ["$log", "$state", "$stateParams", "RecordSchemas", "RecordTypes", "Schemas"],
    angular.module("ase.views.recordtype").controller("RTRelatedAddController", a).directive("aseRtRelatedAdd", b)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f) {
        function g() {
            i.schemaKey = c.schema,
            i.definition = {},
            e.get({
                id: c.uuid
            }).$promise.then(function(a) {
                i.recordType = a,
                d.get({
                    id: i.recordType.current_schema
                }).$promise.then(function(a) {
                    j = a,
                    i.definition = j.schema.definitions[i.schemaKey]
                })
            })
        }
        function h() {
            var c = f.generateFieldName(i.definition.title);
            j.schema.definitions[c] = i.definition,
            d.create({
                schema: j.schema,
                record_type: i.recordType.uuid
            }, function() {
                b.go("^.related", {
                    uuid: i.recordType.uuid
                })
            }, function(b) {
                a.debug("Error saving new schema: ", b)
            })
        }
        var i = this
          , j = null;
        i.submitForm = h,
        g()
    }
    function b() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/recordtype/related-add-edit-partial.html",
            controller: "RTRelatedEditController",
            controllerAs: "rtRelated",
            bindToController: !0
        };
        return a
    }
    a.$inject = ["$log", "$state", "$stateParams", "RecordSchemas", "RecordTypes", "Schemas"],
    angular.module("ase.views.recordtype").controller("RTRelatedEditController", a).directive("aseRtRelatedEdit", b)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h) {
        function i() {
            s.submitForm = r,
            s.populatePropertyKeys = p,
            s.populateEnumFields = q,
            s.reset = n,
            s.selectedContentType = {},
            s.selectedPropertyKey = {},
            s.definitions = {},
            j().then(k).then(l).then(m)
        }
        function j() {
            return e.get({
                id: c.uuid
            }).$promise
        }
        function k(a) {
            return s.recordType = a,
            f.get({
                id: s.recordType.current_schema
            }).$promise
        }
        function l(a) {
            return s.definitions = a.schema.definitions,
            o(s.definitions),
            g.query({
                record_type: a.record_type,
                limit: 1,
                ordering: "-modified"
            }).$promise
        }
        function m(a) {
            var b = a[0];
            b && (s.selectedContentType = _.filter(s.contentDefinitions, function(a) {
                return a.contentTypeKey === b.content_type_key
            })[0],
            s.populatePropertyKeys(),
            s.selectedPropertyKey = _.filter(s.contentPropertyPairs, function(a) {
                return a.propertyKey === b.property_key
            })[0],
            s.costPrefix = b.cost_prefix,
            s.costSuffix = b.cost_suffix,
            s.populateEnumFields(),
            _.forEach(s.enumFields, function(a) {
                a.value = b.enum_costs[a.field]
            }))
        }
        function n() {
            a.go(a.current, {}, {
                reload: !0
            })
        }
        function o(a) {
            var b = _.chain(a).map(function(a, b) {
                return {
                    contentTypeKey: b,
                    definition: a
                }
            }).filter(function(a) {
                return !a.definition.multiple
            }).value();
            s.contentDefinitions = b,
            1 !== s.contentDefinitions.length || s.selectedContentType.selectedContentType || (s.selectedContentType = s.contentDefinitions[0],
            p())
        }
        function p() {
            var a = _.chain(s.selectedContentType.definition.properties).map(function(a, b) {
                return {
                    propertyKey: b,
                    property: a
                }
            }).filter(function(a) {
                return "selectlist" === a.property.fieldType
            }).value();
            s.contentPropertyPairs = a,
            1 === s.contentPropertyPairs.length && (s.selectedPropertyKey = s.contentPropertyPairs[0],
            q())
        }
        function q() {
            var a = s.selectedPropertyKey.property["enum"] || s.selectedPropertyKey.property.items["enum"];
            s.enumFields = [],
            _.forEach(a, function(a) {
                s.enumFields.push({
                    field: a,
                    value: 0
                })
            })
        }
        function r() {
            var a = {
                content_type_key: s.selectedContentType.contentTypeKey,
                property_key: s.selectedPropertyKey.propertyKey,
                cost_prefix: s.costPrefix,
                cost_suffix: s.costSuffix,
                enum_costs: {},
                record_type: c.uuid
            };
            _.forEach(s.enumFields, function(b) {
                a.enum_costs[b.field] = b.value
            }),
            g.create(a, function() {
                h.show({
                    displayClass: "alert-success",
                    text: "Save successful",
                    timeout: 3e3
                })
            }, function() {
                h.show({
                    displayClass: "alert-danger",
                    text: "There was an error while saving",
                    timeout: 3e3
                })
            })
        }
        var s = this;
        s.$onInit = i
    }
    function b() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/recordtype/related-aggregates-partial.html",
            controller: "RTRelatedAggregateController",
            controllerAs: "rtRelated",
            bindToController: !0
        };
        return a
    }
    a.$inject = ["$state", "$scope", "$stateParams", "Schemas", "RecordTypes", "RecordSchemas", "RecordCosts", "Notifications"],
    angular.module("ase.views.recordtype").controller("RTRelatedAggregateController", a).directive("aseRtRelatedAggregates", b)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h) {
        function i() {
            r.schemaKey = b.schema,
            r.onDataChange = n,
            r.onSaveClicked = q,
            j().then(k).then(l).then(m)
        }
        function j() {
            return d.get({
                id: b.uuid
            }).$promise.then(function(a) {
                r.recordType = a
            })
        }
        function k() {
            var a = r.recordType.current_schema;
            return e.get({
                id: a
            }).$promise.then(function(a) {
                r.recordSchema = a,
                r.schemaTitle = a.schema.definitions[r.schemaKey].title
            })
        }
        function l() {
            return c.get({
                name: "related"
            }).$promise.then(function(a) {
                console.log("got related");
                console.log(a);
                r.relatedBuilderSchema = a
            })
        }
        function m() {
            var b = _.pick(r.recordSchema.schema.definitions, function(a) {
                return !!a.properties._localId
            });
            b = _.pick(b, function(a, b) {
                return b !== r.schemaKey
            }),
            b = _.pick(b, function(a) {
                return a.multiple
            }),
            b = _.map(b, function(a, b) {
                return {
                    value: b,
                    title: a.title
                }
            }),
            r.relatedBuilderSchema.definitions.localReference.properties.referenceTarget.enumSource = [{
                source: b,
                title: "{{item.title}}",
                value: "{{item.value}}"
            }];
            var c = r.relatedBuilderSchema.toJSON()
              , d = r.recordSchema.schema.definitions[r.schemaKey];
            c.description = d.description,
            c.title = d.title,
            c.plural_title = d.plural_title;
            var e = f.schemaFormDataFromDefinition(d);
            a.debug("Initializing form with startval", e),
            r.editor = {
                id: "schema-editor",
                options: {
                    schema: c,
                    disable_edit_json: !0,
                    disable_properties: !0,
                    disable_array_add: !1,
                    theme: "bootstrap3",
                    show_errors: "change",
                    no_additional_properties: !0,
                    startval: e
                },
                errors: []
            },
            h.customValidators.push(o),
            h.customValidators.push(p)
        }
        function n(b, c) {
            s = b;
            var d = f.validateSchemaFormData(b);
            r.editor.errors = c.concat(d),
            a.debug("Schema Entry Form data:", b, "Errors:", c, "CustomErrors:", d)
        }
        function o(a, b, c) {
            var d = []
              , e = "referenceTarget";
            return b && "object" == typeof b && b.referenceTarget ? (b.referenceTarget === r.schemaKey && d.push({
                path: c,
                property: e,
                message: "Relationship must be to a different related content type"
            }),
            d) : d
        }
        function p(a, b, c) {
            var d = []
              , e = "referenceTarget";
            return b && "object" == typeof b && b.referenceTarget ? (r.recordSchema.schema.definitions[b.referenceTarget].multiple || d.push({
                path: c,
                property: e,
                message: "Relationship must be to a multiple content type"
            }),
            d) : d
        }
        function q() {
            if (r.editor.errors.length > 0)
                return g.show({
                    displayClass: "alert-danger",
                    text: "Saving failed: invalid data schema definition"
                }),
                void a.debug("Validation errors on save:", r.editor.errors);
            var b = f.definitionFromSchemaFormData(s, r.recordSchema.schema, r.schemaKey);
            a.debug("Serialized schema to save:", b);
            var c = r.recordSchema.schema.definitions;
            c[r.schemaKey] = angular.extend(c[r.schemaKey], b),
            e.create({
                record_type: r.recordType.uuid,
                schema: r.recordSchema.schema
            }).$promise.then(function() {
                g.show({
                    text: "Schema saved successfully",
                    displayClass: "alert-success",
                    timeout: 3e3
                })
            })["catch"](function(b) {
                a.debug("Error saving schema:", b),
                g.show({
                    text: "Error saving schema: " + b.statusText,
                    displayClass: "alert-danger",
                    timeout: 3e3
                })
            })
        }
        var r = this
          , s = null;
        i()
    }
    a.$inject = ["$log", "$stateParams", "BuilderSchemas", "RecordTypes", "RecordSchemas", "Schemas", "Notifications", "JsonEditorDefaults"],
    angular.module("ase.views.recordtype").controller("RTSchemaEditController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/recordtype/schema/edit-partial.html",
            controller: "RTSchemaEditController",
            controllerAs: "rtSchemaEdit",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.recordtype").directive("aseRtSchemaEdit", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("settings", {
            "abstract": !0,
            parent: "sidebar",
            url: "/settings",
            template: "<ui-view></ui-view>"
        }),
        a.state("settings.list", {
            url: "",
            template: "<ase-settings-list></ase-settings-list>"
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("ase.views.settings", ["ui.router", "ui.bootstrap", "ase.utils", "ase.config", "ase.directives", "ase.notifications", "ase.views.sidebar", "ase.auth"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f() {
            c.query().$promise.then(function(a) {
                h.blackSpotConfig = a[0]
            })
        }
        function g() {
            var b = h.blackSpotConfig.severity_percentile_threshold;
            return void 0 === b || 0 > b || b > 1 ? void d.show({
                html: "<h4>Black spot severity threshold must be between 0 and 1</h4>",
                displayClass: "alert-danger"
            }) : void c.update(h.blackSpotConfig, function() {
                d.show({
                    text: "Successfully updated black spot severity threshold",
                    displayClass: "alert-success",
                    timeout: 3e3
                })
            }, function(b) {
                a.error("error updating black spot severity threshold:"),
                a.error(b);
                var c = "<h4>Failed to update black spot severity threshold</h4>";
                c += e.buildErrorHtml(b),
                d.show({
                    html: c,
                    displayClass: "alert-danger"
                })
            })
        }
        var h = this;
        h.blackSpotSeverityUpdateClicked = g,
        f()
    }
    a.$inject = ["$log", "$scope", "BlackSpotConfig", "Notifications", "Utils"],
    angular.module("ase.views.settings").controller("SettingsListController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/settings/list-partial.html",
            controller: "SettingsListController",
            controllerAs: "SettingsList",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.settings").directive("aseSettingsList", a)
}(),
function() {
    "use strict";
    function a(a) {
        a.state("usermgmt", {
            "abstract": !0,
            parent: "sidebar",
            url: "/user-management",
            template: "<ui-view></ui-view>"
        }),
        a.state("usermgmt.list", {
            url: "",
            template: "<ase-user-list></ase-user-list>"
        }),
        a.state("usermgmt.add", {
            url: "/add",
            template: "<ase-user-add></ase-user-add>"
        }),
        a.state("usermgmt.edit", {
            url: "/edit/:userid",
            template: "<ase-user-edit></ase-user-edit>"
        }),
        a.state("usermgmt.details", {
            url: "/details/:userid",
            template: "<ase-user-details></ase-user-details>"
        })
    }
    a.$inject = ["$stateProvider"],
    angular.module("ase.views.usermgmt", ["ui.router", "ui.bootstrap", "ase.utils", "ase.config", "ase.directives", "ase.notifications", "ase.views.sidebar", "ase.auth", "ase.userdata"]).config(a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e) {
        function f() {
            k.users = {},
            k.groups = _.values(e.api.groups).sort(),
            k.groupFilter = null,
            k.deleteUser = g,
            k.onGroupSelected = j,
            i()
        }
        function g(b) {
            d.User["delete"]({
                id: b.id
            }, function() {
                i(),
                c.show({
                    text: "Deleted user " + b.username + " successfully.",
                    displayClass: "alert-success",
                    timeout: 3e3
                })
            }, function(d) {
                a.error(d),
                c.show({
                    text: "Error deleting user " + b.email,
                    displayClass: "alert-danger"
                })
            })
        }
        function h() {
            k.users = _.filter(k.allUsers, function(a) {
                return !k.groupFilter || _.contains(a.groups, k.groupFilter)
            })
        }
        function i() {
            d.User.query().$promise.then(function(a) {
                k.allUsers = a,
                h()
            })
        }
        function j(a) {
            k.groupFilter = a,
            h()
        }
        var k = this;
        f()
    }
    a.$inject = ["$log", "$scope", "Notifications", "UserService", "ASEConfig"],
    angular.module("ase.views.usermgmt").controller("UserListController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/usermgmt/list-partial.html",
            controller: "UserListController",
            controllerAs: "UserList",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.usermgmt").directive("aseUserList", a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        function d() {
            e()
        }
        function e() {
            c.getUser(a.userid).then(function(a) {
                f.user = a,
                f.user.token = b.getToken()
            })
        }
        var f = this;
        f.user = {},
        d()
    }
    a.$inject = ["$stateParams", "AuthService", "UserService"],
    angular.module("ase.views.usermgmt").controller("UserDetailsController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/usermgmt/details-partial.html",
            controller: "UserDetailsController",
            controllerAs: "UserDetails",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.usermgmt").directive("aseUserDetails", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g, h) {
        function i() {
            j()
        }
        function j() {
            f.getUser(c.userid).then(function(a) {
                l.user = a,
                l.user.token = e.getToken(),
                l.userGroup = k()
            })
        }
        function k() {
            var a = l.user.groups;
            return a.indexOf(d.api.groups.admin) > -1 ? d.api.groups.admin : a.indexOf(d.api.groups.readWrite) > -1 ? d.api.groups.readWrite : d.api.groups.readOnly
        }
        var l = this;
        l.user = {},
        l.userGroup = "",
        l.groups = d.api.groups,
        i(),
        l.submitForm = function() {
            var c = {
                username: l.user.username,
                email: l.user.email,
                groups: [l.userGroup]
            };
            f.User.update({
                id: l.user.id
            }, c, function() {
                j(),
                g.show({
                    text: "Successfully updated user " + l.user.email,
                    displayClass: "alert-success",
                    timeout: 3e3
                }),
                b.go("usermgmt.list")
            }, function(b) {
                a.error("error updating user:"),
                a.error(b);
                var c = "<h4>Failed to modify user</h4>";
                c += h.buildErrorHtml(b),
                g.show({
                    html: c,
                    displayClass: "alert-danger"
                })
            })
        }
    }
    a.$inject = ["$log", "$state", "$stateParams", "ASEConfig", "AuthService", "UserService", "Notifications", "Utils"],
    angular.module("ase.views.usermgmt").controller("UserEditController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/usermgmt/edit-partial.html",
            controller: "UserEditController",
            controllerAs: "UserEdit",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.usermgmt").directive("aseUserEdit", a)
}(),
function() {
    "use strict";
    function a(a, b, c, d, e, f, g) {
        var h = this;
        h.user = {},
        h.userGroup = "",
        h.groups = c.api.groups,
        h.submitForm = function() {
            h.user.groups = [h.userGroup],
            e.User.create(h.user, function() {
                f.show({
                    text: "User " + h.user.username + " created successfully",
                    displayClass: "alert-success",
                    timeout: 3e3
                }),
                b.go("usermgmt.list")
            }, function(b) {
                a.error("error creating user:"),
                a.error(b);
                var c = "<h4>Failed to create user</h4>";
                c += g.buildErrorHtml(b),
                f.show({
                    html: c,
                    displayClass: "alert-danger"
                })
            })
        }
    }
    a.$inject = ["$log", "$state", "ASEConfig", "AuthService", "UserService", "Notifications", "Utils"],
    angular.module("ase.views.usermgmt").controller("UserAddController", a)
}(),
function() {
    "use strict";
    function a() {
        var a = {
            restrict: "E",
            templateUrl: "/static/scripts/views/usermgmt/add-partial.html",
            controller: "UserAddController",
            controllerAs: "UserAdd",
            bindToController: !0
        };
        return a
    }
    angular.module("ase.views.usermgmt").directive("aseUserAdd", a)
}(),
function() {
    "use strict";
    function a(a, b, c) {
        a.html5Mode(c.html5Mode.enabled),
        a.hashPrefix(c.html5Mode.prefix),
        b.otherwise(function(a) {
            var b = a.get("$state");
            b.go("rt.list")
        })
    }
    function b(a, b) {
        a.debugEnabled(b.debug)
    }
    function c(a) {
        a.setPrefix("DRIVER.ASE")
    }
    function d(a, b, c, d, e, f) {
        b.defaults.xsrfHeaderName = "X-CSRFToken",
        b.defaults.xsrfCookieName = "csrftoken",
        c.$on("$stateChangeStart", function(a, b, f, g, h) {
            return e.isAuthenticated() ? void 0 : (a.preventDefault(),
            void d.go("login", null, {
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
    a.$inject = ["$locationProvider", "$urlRouterProvider", "ASEConfig"],
    b.$inject = ["$logProvider", "ASEConfig"],
    c.$inject = ["localStorageServiceProvider"],
    d.$inject = ["$cookies", "$http", "$rootScope", "$state", "AuthService", "LogoutInterceptor"],
    angular.module("ase", ["ase.auth", "ase.config", "ase.notifications", "ase.navbar", "ase.views.geography", "ase.views.login", "ase.views.recordtype", "ase.views.settings", "ase.views.usermgmt", "ase.resources", "ui.router", "LocalStorageModule"]).config(a).config(c).config(b).run(d)
}();
