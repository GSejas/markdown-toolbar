/**
 * @moduleName: Command Registry - Central Command Registration
 * @version: 1.0.0
 * @since: 2025-09-02
 * @lastUpdated: 2025-09-02
 * @projectSummary: Central registry for all markdown toolbar commands
 * @techStack: TypeScript, VS Code API
 * @dependency: vscode
 * @interModuleDependency: All command classes
 * @requirementsTraceability: Command registration and management
 * @briefDescription: Registers and manages all markdown formatting commands
 * @methods: registerAll
 * @contributors: Extension Team
 * @examples: Registers mdToolbar.* commands with VS Code
 * @vulnerabilitiesAssessment: Standard VS Code API usage, modular command organization
 */

import * as vscode from 'vscode';
import { BoldCommand } from './format/BoldCommand';
import { ItalicCommand } from './format/ItalicCommand';
import { StrikethroughCommand } from './format/StrikethroughCommand';
import { HeadingCommand } from './heading/HeadingCommand';
import { BlockquoteCommand } from './structure/BlockquoteCommand';
import { ListCommand } from './structure/ListCommand';
import { CodeCommand } from './code/CodeCommand';
import { LinkCommand } from './media/LinkCommand';
import { ImageCommand } from './media/ImageCommand';
import { ExtendedCommand } from './extended/ExtendedCommand';

export class CommandRegistry {
    private boldCommand = new BoldCommand();
    private italicCommand = new ItalicCommand();
    private strikethroughCommand = new StrikethroughCommand();
    private headingCommand = new HeadingCommand();
    private blockquoteCommand = new BlockquoteCommand();
    private listCommand = new ListCommand();
    private codeCommand = new CodeCommand();
    private linkCommand = new LinkCommand();
    private imageCommand = new ImageCommand();
    private extendedCommand = new ExtendedCommand();

    registerAll(context: vscode.ExtensionContext): void {
        // Format commands
        context.subscriptions.push(
            vscode.commands.registerCommand('mdToolbar.fmt.bold', () => this.boldCommand.execute()),
            vscode.commands.registerCommand('mdToolbar.fmt.italic', () => this.italicCommand.execute()),
            vscode.commands.registerCommand('mdToolbar.fmt.strike', () => this.strikethroughCommand.execute())
        );

        // Heading commands
        context.subscriptions.push(
            vscode.commands.registerCommand('mdToolbar.heading.h1', () => this.headingCommand.executeHeading(1)),
            vscode.commands.registerCommand('mdToolbar.heading.h2', () => this.headingCommand.executeHeading(2)),
            vscode.commands.registerCommand('mdToolbar.heading.h3', () => this.headingCommand.executeHeading(3)),
            vscode.commands.registerCommand('mdToolbar.heading.h4', () => this.headingCommand.executeHeading(4)),
            vscode.commands.registerCommand('mdToolbar.heading.h5', () => this.headingCommand.executeHeading(5)),
            vscode.commands.registerCommand('mdToolbar.heading.h6', () => this.headingCommand.executeHeading(6)),
            vscode.commands.registerCommand('mdToolbar.heading.toggle', () => this.headingCommand.cycleHeading())
        );

        // Structure commands
        context.subscriptions.push(
            vscode.commands.registerCommand('mdToolbar.blockquote.toggle', () => this.blockquoteCommand.execute()),
            vscode.commands.registerCommand('mdToolbar.list.toggle', () => this.listCommand.toggleBulletList()),
            vscode.commands.registerCommand('mdToolbar.task.toggle', () => this.listCommand.toggleTaskList())
        );

        // Code commands
        context.subscriptions.push(
            vscode.commands.registerCommand('mdToolbar.code.inline', () => this.codeCommand.toggleInlineCode()),
            vscode.commands.registerCommand('mdToolbar.code.block', () => this.codeCommand.insertCodeBlock())
        );

        // Media commands
        context.subscriptions.push(
            vscode.commands.registerCommand('mdToolbar.link.insert', () => this.linkCommand.execute()),
            vscode.commands.registerCommand('mdToolbar.image.insert', () => this.imageCommand.execute()),
            vscode.commands.registerCommand('mdToolbar.image.paste', () => this.imageCommand.pasteImage())
        );

        // Extended commands
        context.subscriptions.push(
            vscode.commands.registerCommand('mdToolbar.footnote.insert', () => this.extendedCommand.insertFootnote()),
            vscode.commands.registerCommand('mdToolbar.math.inline', () => this.extendedCommand.insertMathInline()),
            vscode.commands.registerCommand('mdToolbar.math.block', () => this.extendedCommand.insertMathBlock()),
            vscode.commands.registerCommand('mdToolbar.hr.insert', () => this.extendedCommand.insertHorizontalRule()),
            vscode.commands.registerCommand('mdToolbar.break.line', () => this.extendedCommand.insertLineBreak())
        );

        // Preview commands (delegate to built-in VS Code commands)
        context.subscriptions.push(
            vscode.commands.registerCommand('mdToolbar.preview.side', () =>
                vscode.commands.executeCommand('markdown.showPreviewToSide')
            ),
            vscode.commands.registerCommand('mdToolbar.preview.current', () =>
                vscode.commands.executeCommand('markdown.showPreview')
            )
        );

        // Table menu command
        context.subscriptions.push(
            vscode.commands.registerCommand('mdToolbar.table.menu', () => this.showTableMenu())
        );
    }

    private async showTableMenu(): Promise<void> {
        const choice = await vscode.window.showQuickPick([
            { label: 'Insert 2x2 table', description: 'Simple 2 columns × 2 rows' },
            { label: 'Insert 3x3 table', description: '3 columns × 3 rows' },
            { label: 'Insert header-only table', description: 'Header row with separators' }
        ]);

        if (!choice) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        let tableText: string;
        switch (choice.label) {
            case 'Insert 2x2 table':
                tableText = `| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |\n`;
                break;
            case 'Insert 3x3 table':
                tableText = `| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n| Cell 7   | Cell 8   | Cell 9   |\n`;
                break;
            case 'Insert header-only table':
                tableText = `| Header 1 | Header 2 |\n|----------|----------|\n`;
                break;
            default:
                return;
        }

        await editor.edit(editBuilder => {
            editBuilder.replace(editor.selection, tableText);
        });
    }
}
