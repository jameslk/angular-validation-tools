(function(angular, module, define) {
    function exportModule(angularModule) {
        if (module && module.exports) {
                module.exports = angularModule;
        } else {
            if ((typeof define === 'function') && define.amd) {
                define(function () { return angularModule; });
            }
        }
    }

    var angularModule = angular.module('jameslk.angular-validation-tools', [])

    .provider('ValidationToolsConfig', function() {
        function RuleError(errorName, errorMessage) {
            this.errorName = errorName;
            this.errorMessage = errorMessage;
        }

        this._ruleErrors = {};

        this.getRuleErrors = function() {
            return this._ruleErrors;
        }

        this.setRuleErrors = function(ruleErrors) {
            this._ruleErrors = ruleErrors;
            return this;
        };

        this.setRuleError = function(errorName, errorMessage) {
            this._ruleErrors[errorName] = new RuleError(errorName, errorMessage);
            return this;
        }

        var config = this;

        this.$get = function() {
            return {
                getRuleErrors: function() {
                    return config.getRuleErrors();
                },

                getRuleError: function(rule) {
                    return config.getRuleErrors[rule];
                }
            }
        };

        this
            .setRuleError('required', 'This field is required')
            .setRuleError('email', 'A valid email is required')

            .setRuleError('minlength', function(input) {
                return 'Must be longer than ' + input.attr('ng-minlength');
            })
        ;
    })

    .directive('vtValidationConstraints', function($compile) {
        function applyRuleErrors(element, ruleErrors) {
            for (var directiveName in ruleErrors) {
                if (ruleErrors.hasOwnProperty(directiveName)) {
                    var ruleValue = ruleErrors[directiveName];

                    element.attr(directiveName, ruleValue ? ruleValue : directiveName);
                }
            }
        }

        return {
            restrict: 'A',

            terminal: true,

            priority: 1000,

            link: function(scope, element, attrs) {
                var constraints = scope[attrs.vtValidationConstraints];

                for (var elementId in constraints) {
                    if (constraints.hasOwnProperty(elementId)) {
                        var ruleErrors = constraints[elementId];

                        applyRuleErrors(element.find('#' + elementId), ruleErrors)
                    }
                }

                element.attr('vt-has-validations', 'vt-has-validations');
                element.attr('novalidate', 'novalidate'); // turn off HTML5 validations if not already
                element.removeAttr('vt-validation-constraints'); // so we don't have a recursive loop
                $compile(element)(scope);
            }
        }
    })

    .directive('vtHasValidations', function() {
        return {
            restrict: 'A',

            require: 'form',

            controller: function($scope) {
                this.onValidationErrors = function(callback) {
                    $scope.$on('ValidationTools.validationError', callback);
                };
            },

            link: function(scope, element, attrs, formController) {
                element.on('submit', function(event) {
                    if (formController.$invalid) {
                        event.preventDefault();

                        scope.$broadcast('ValidationTools.validationError');
                    }
                });
            }
        }
    })

    .directive('vtValidationErrors', function(ValidationToolsConfig) {
        function getInputElement(attrs) {
            if (!attrs.hasOwnProperty('forId')) {
                throw 'for-id needs to be set for validationError element';
            }

            var inputElement = angular.element('#' + attrs.forId);

            if (!inputElement.length) {
                throw 'Cannot find element with id ' + attrs.forId;
            }

            if (!inputElement.attr('name')) {
                throw 'Input ' + attrs.forId + ' needs to have a name attribute for validation to work';
            }

            return inputElement;
        }

        function setErrorMessagesFromStatus(scope, errorStatus) {
            var validationRuleErrors = ValidationToolsConfig.getRuleErrors();
            scope.errors = [];
            
            for (var errorName in errorStatus) {
                if (errorStatus.hasOwnProperty(errorName) && errorStatus[errorName]) {
                    if (validationRuleErrors.hasOwnProperty(errorName)) {
                        var errorMessage = validationRuleErrors[errorName].errorMessage;

                        if (typeof errorMessage === 'function') {
                            errorMessage = errorMessage(scope._inputElement);
                        } else if (!errorMessage) {
                            continue; // Skip blank error messages
                        }
                    } else {
                        var errorMessage = 'Invalid: ' + errorName;
                    }

                    scope.errors.push(errorMessage);
                }
            }
        }

        return {
            require: '^form',

            scope: true,

            controller: function($scope) {
                $scope.validation = null;
                $scope.errors = [];
                $scope._inputElement = null;
                $scope.valid = true;
                $scope.invalid = false;
            },

            link: function(scope, element, attrs, formController) {
                scope._inputElement = getInputElement(attrs);
                var elementName = scope._inputElement.attr('name');

                scope.validation = formController[elementName];

                scope.$watch('validation.$error', function(errorStatus) {
                    setErrorMessagesFromStatus(scope, errorStatus);
                }, true);

                scope.$watch('validation.$valid', function(valid) {
                    scope.valid = scope.validation.$valid;
                    scope.invalid = scope.validation.$invalid;
                });
            }
        }
    })

    .directive('vtShowOnSubmit', function() {
        function show(element) {
            element.addClass('ng-show');
            element.removeClass('ng-hide');
        }

        function hide(element) {
            element.addClass('ng-hide');
            element.removeClass('ng-show');
        }

        function showOnSubmit(scope, element, hasValidationsController) {
            hide(element);

            hasValidationsController.onValidationErrors(function() {
                show(element);
            });
        }

        return {
            restrict: 'AC',

            require: [
                '^vtHasValidations',
                'vtValidationErrors' // this is required to ensure we have the correct scope
            ],

            link: function(scope, element, attrs, controllers) {
                var hasValidationsController = controllers[0]
                    validationErrorsController = controllers[1];

                showOnSubmit(scope, element, hasValidationsController);
            }
        }
    });

    exportModule(angularModule);
})(angular, module, define);