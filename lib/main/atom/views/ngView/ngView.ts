import {uriForPath} from "../../atomUtils";
import * as sp from "atom-space-pen-views";

// Fixing angular CSP: 
document.body.setAttribute('data-ng-csp', 'true');
// And then import angular
import angular = require('angular');

import {NgContext, getContext} from "./angularContext";

export var NGViewDemoHtml = `
<div>This is a test {{vm.foo}}</div>
<input ng-model="vm.foo"/>
`;
export class NGViewDemoClass {
    foo = 0;
    constructor(ngContext: NgContext) {
        ngContext.$interval(() => {            
            console.log('called');
        }, 10);
    }
}

/**
 * A base class for creating angular based views in atom
 */
export class NgView extends sp.ScrollView {

    public mainContent: JQuery;
    static content() {
        return this.div({ class: 'atomts-angular-view' }, () => {
            this.div({ outlet: 'mainContent' });
        });
    }

    constructor(public config: {
        icon: string;
        title: string;
        protocol: string;
        filePath: string;
        
        // Potentially move this higher up.
        html: string;
        controller: { name: string; new (ngContext: NgContext) };
    }) {
        super();
        
        // init angular
        var name = config.controller.name;
        this.mainContent[0].innerHTML = `<div class="native-key-bindings" ng-controller="${name}">${config.html}</div>`;
        var app = angular.module('app', [])
            .controller(config.controller.name, ($scope, $injector) =>
            $scope.vm = new config.controller(getContext($injector, $scope)));
        angular.bootstrap(<any>this.$[0], ['app']);
    }

        
    /** Override */
    static protocol: string = 'ngview:';

    public get $() { return <JQuery><any>this; }
    private getURI = () => uriForPath(this.config.protocol, this.config.filePath);
    private getTitle = () => this.config.title;
    private getIconName = () => this.config.icon;
}      