# angular-validation-tools

A library to help take the unnecessary boilerplate work and completely out-of-place validation logic out of your views.
What's more, this library doesn't subvert Angular's validation system like other libraries. It allows you to use all
of Angular's validation directives and other third party directives.

## Why?

AngularJS does a great job of providing a basic framework for form validation with plenty of flexibility and opportunity for
customizability. Unfortunately, it leaves much of the work for implementing the display of validation errors to the developer.
Even worse, it forces you to litter your views with validation logic, defeating its design goal of keeping domain logic
out of the presentation layer.