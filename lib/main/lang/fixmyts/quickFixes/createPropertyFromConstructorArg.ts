import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../astUtils";
import {EOL} from "os";

interface IndentSetting {
    classIndent: number;
    indent: number;
}

export class CreatePropertyFromConstructorArg implements QuickFix {
    key = CreatePropertyFromConstructorArg.name;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {

        if (info.positionNode && info.positionNode.parent &&
            info.positionNode.parent.parent && info.positionNode.parent.parent.symbol &&
            info.positionNode.parent.parent.symbol && info.positionNode.parent.parent.symbol.name == '__constructor') {

            if (info.positionNode.parent.kind == ts.SyntaxKind.Parameter) {
                return { display: "create read only property for " + info.positionNode.parent.symbol.name };
            }
        }
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        let classDecl = <ts.ClassDeclaration>info.positionNode.parent.parent.parent;
        let constructorDecl = <ts.ConstructorDeclaration>info.positionNode.parent.parent;
        let paramDecl = <ts.ParameterDeclaration>info.positionNode.parent;

        let symbolName = info.positionNode.parent.symbol.name;
        let typeName = this.getArgumentType(info, paramDecl);

        let firstBrace = classDecl.getChildren().filter(x=> x.kind == ts.SyntaxKind.OpenBraceToken)[0];

        let classIndent = info.service.getIndentationAtPosition(
            info.filePath, firstBrace.end, info.project.projectFile.project.formatCodeOptions);
        let indent = info.project.projectFile.project.formatCodeOptions.IndentSize;

        let indentSetting = {
            classIndent,
            indent
        };

        let backingDeclaration = this.createBackingDeclaration(
            classDecl,
            symbolName,
            typeName,
            indentSetting,
            info.filePath);

        let assignemnt = this.createAssignment(
            constructorDecl,
            symbolName,
            indentSetting,
            info.filePath);

        let property = this.createProperty(
            classDecl,
            symbolName,
            typeName,
            indentSetting,
            info.filePath);

        return [backingDeclaration, assignemnt, property];

    }

    private getArgumentType(
        info: QuickFixQueryInformation,
        paramDecl: ts.ParameterDeclaration): string {
        if (paramDecl.type) {
            let start = paramDecl.type.pos;
            let end = paramDecl.type.end;
            return info.srcFile.text.substr(start, (end - start)).trim();
        } else {
            return 'any';
        }
    }

    private createBackingDeclaration(
        classDecl: ts.ClassDeclaration,
        symbolName: string,
        typeName: string,
        indentSetting: IndentSetting,
        filePath: string): Refactoring {

        let indent = this.createIndent(indentSetting, 1);
        let newText = `${indent}_${symbolName}: ${typeName};${EOL}`;

        return {
            span: {
                start: classDecl.nextContainer.pos + 1,
                length: 0
            },
            newText: newText,
            filePath: filePath
        };
    }

    private createAssignment(
        constructorDecl: ts.ConstructorDeclaration,
        symbolName: string,
        indentSetting: IndentSetting,
        filePath: string): Refactoring {

        let indentLevel2 = this.createIndent(indentSetting, 2);
        let lastBrace = constructorDecl.body.getChildren().filter(x=> x.kind == ts.SyntaxKind.CloseBraceToken)[0];

        let newText = `${EOL}${indentLevel2}this._${symbolName} = ${symbolName};`;

        return {
            span: {
                start: lastBrace.end - (6 + indentSetting.classIndent),
                length: 0
            },
            newText: newText,
            filePath: filePath
        };
    }

    private createProperty(
        classDecl: ts.ClassDeclaration,
        symbolName: string,
        typeName: string,
        indentSetting: IndentSetting,
        filePath: string): Refactoring {

        let indentLevel1 = this.createIndent(indentSetting, 1);
        let indentLevel2 = this.createIndent(indentSetting, 2);

        let newText = `${EOL}${indentLevel1}get ${symbolName}(): ${typeName} {` +
            `${EOL}${indentLevel2}return this._${symbolName};` +
            `${EOL}${indentLevel1}}`;

        return {
            span: {
                start: classDecl.end - (2 + indentSetting.classIndent),
                length: 0
            },
            newText: newText,
            filePath: filePath
        };
    }

    private createIndent(indentSetting: IndentSetting, level: number): string {
        return Array(indentSetting.classIndent + (indentSetting.indent * level) + 1).join(' ');
    }
}
