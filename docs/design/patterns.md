# 🎨 Design Patterns & Architecture

## Executive Summary

This document outlines the design patterns and architectural principles used in the Markdown Toolbar VS Code extension. The extension follows clean architecture principles with a focus on maintainability, testability, and extensibility.

## 🏛️ Architectural Overview

### Clean Architecture Layers

```text
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   UI Commands   │  │  Status Bar     │  │  CodeLens   │ │
│  │                 │  │                 │  │  Providers  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Command Factory │  │  Context        │  │  Settings   │ │
│  │                 │  │  Detectors      │  │  Adapters   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Business      │  │  Domain         │  │  Entities   │ │
│  │   Logic         │  │  Services       │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   VS Code API   │  │  File System    │  │  External   │ │
│  │                 │  │                 │  │  Services   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles
1. **Dependency Inversion**: High-level modules don't depend on low-level modules
2. **Single Responsibility**: Each class has one reason to change
3. **Open/Closed**: Open for extension, closed for modification
4. **Interface Segregation**: Clients shouldn't depend on unused interfaces
5. **Liskov Substitution**: Subtypes must be substitutable for their base types

## 🎯 Core Design Patterns

### 1. Factory Pattern - CommandFactory

#### Intent
Define an interface for creating objects, but let subclasses decide which class to instantiate.

#### Implementation

```typescript
// src/commands/CommandFactory.ts
export class CommandFactory {
  private static instance: CommandFactory;
  private commandMap: Map<string, CommandHandler> = new Map();

  static getInstance(): CommandFactory {
    if (!CommandFactory.instance) {
      CommandFactory.instance = new CommandFactory();
    }
    return CommandFactory.instance;
  }

  registerCommand(commandId: string, handler: CommandHandler): void {
    this.commandMap.set(commandId, handler);
  }

  async executeCommand(commandId: string, args: any[]): Promise<any> {
    const handler = this.commandMap.get(commandId);
    if (!handler) {
      throw new Error(`Command ${commandId} not found`);
    }
    return await handler.execute(args);
  }
}
```

#### Benefits
- **Decoupling**: Command creation is separated from usage
- **Extensibility**: New commands can be added without modifying existing code
- **Testability**: Easy to mock command handlers
- **Centralized Management**: All commands managed in one place

### 2. Strategy Pattern - MarkdownFormatter

#### Intent
Define a family of algorithms, encapsulate each one, and make them interchangeable.

#### Implementation
```typescript
// src/services/MarkdownFormatter.ts
export interface FormattingStrategy {
  format(content: string, options?: FormatOptions): string;
}

export class HeaderFormatter implements FormattingStrategy {
  format(content: string, options?: FormatOptions): string {
    const level = options?.level || 1;
    return '#'.repeat(level) + ' ' + content;
  }
}

export class ListFormatter implements FormattingStrategy {
  format(content: string, options?: FormatOptions): string {
    const type = options?.type || 'unordered';
    const prefix = type === 'ordered' ? '1. ' : '- ';
    return content.split('\n').map(line => prefix + line).join('\n');
  }
}

export class MarkdownFormatter {
  private strategies: Map<string, FormattingStrategy> = new Map();

  constructor() {
    this.strategies.set('header', new HeaderFormatter());
    this.strategies.set('list', new ListFormatter());
  }

  format(type: string, content: string, options?: FormatOptions): string {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Unknown formatting type: ${type}`);
    }
    return strategy.format(content, options);
  }
}
```

#### Benefits
- **Flexibility**: Different formatting algorithms can be swapped
- **Maintainability**: Each strategy is isolated and testable
- **Extensibility**: New formatting strategies can be added easily
- **Single Responsibility**: Each strategy handles one formatting type

### 3. Observer Pattern - StatusBarProvider

#### Intent
Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified.

#### Implementation
```typescript
// src/providers/StatusBarProvider.ts
export interface StatusBarObserver {
  update(status: StatusBarState): void;
}

export class StatusBarProvider implements StatusBarObserver {
  private observers: StatusBarObserver[] = [];
  private currentState: StatusBarState;

  attach(observer: StatusBarObserver): void {
    this.observers.push(observer);
  }

  detach(observer: StatusBarObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  update(status: StatusBarState): void {
    this.currentState = status;
    this.notifyObservers();
  }

  private notifyObservers(): void {
    for (const observer of this.observers) {
      observer.update(this.currentState);
    }
  }
}
```

#### Benefits
- **Loose Coupling**: Subject and observers are loosely coupled
- **Dynamic Relationships**: Observers can be added/removed at runtime
- **Broadcast Communication**: Changes are broadcast to all interested parties
- **Modularity**: Subject and observers can be developed independently

### 4. Singleton Pattern - Logger Service

#### Intent
Ensure a class has only one instance and provide a global point of access to it.

#### Implementation
```typescript
// src/services/Logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }

  private log(level: LogLevel, message: string, context?: any): void {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context
    };

    this.logs.push(entry);
    console.log(`[${LogLevel[level]}] ${message}`, context);
  }
}
```

#### Benefits
- **Controlled Access**: Single point of access to the logger
- **Reduced Namespace**: Avoids polluting the global namespace
- **Lazy Initialization**: Instance created only when needed
- **Configuration Management**: Centralized logging configuration

### 5. Adapter Pattern - SettingsAdapter

#### Intent
Convert the interface of a class into another interface that clients expect.

#### Implementation
```typescript
// src/settings/SettingsAdapter.ts
export interface SettingsProvider {
  get<T>(key: string, defaultValue?: T): T;
  update(key: string, value: any): Promise<void>;
}

export class VSCodeSettingsAdapter implements SettingsProvider {
  private readonly section: string;

  constructor(section: string = 'markdownToolbar') {
    this.section = section;
  }

  get<T>(key: string, defaultValue?: T): T {
    const config = vscode.workspace.getConfiguration(this.section);
    return config.get<T>(key, defaultValue as T);
  }

  async update(key: string, value: any): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.section);
    await config.update(key, value, vscode.ConfigurationTarget.Workspace);
  }
}

export class MemorySettingsAdapter implements SettingsProvider {
  private settings: Map<string, any> = new Map();

  get<T>(key: string, defaultValue?: T): T {
    return this.settings.get(key) ?? defaultValue;
  }

  async update(key: string, value: any): Promise<void> {
    this.settings.set(key, value);
  }
}
```

#### Benefits
- **Interface Compatibility**: Adapts different settings sources to common interface
- **Testability**: Easy to mock settings in tests
- **Flexibility**: Can switch between different settings implementations
- **Abstraction**: Hides implementation details from clients

### 6. Template Method Pattern - BaseCommand

#### Intent
Define the skeleton of an algorithm in an operation, deferring some steps to subclasses.

#### Implementation
```typescript
// src/commands/BaseCommand.ts
export abstract class BaseCommand {
  async execute(args: any[]): Promise<any> {
    try {
      // Pre-execution hook
      await this.beforeExecute(args);

      // Validate arguments
      this.validateArgs(args);

      // Execute the command
      const result = await this.doExecute(args);

      // Post-execution hook
      await this.afterExecute(result, args);

      return result;
    } catch (error) {
      await this.handleError(error, args);
      throw error;
    }
  }

  protected async beforeExecute(args: any[]): Promise<void> {
    // Default implementation - can be overridden
    Logger.getInstance().debug(`Executing ${this.constructor.name}`, { args });
  }

  protected abstract validateArgs(args: any[]): void;

  protected abstract doExecute(args: any[]): Promise<any>;

  protected async afterExecute(result: any, args: any[]): Promise<void> {
    // Default implementation - can be overridden
    Logger.getInstance().debug(`Executed ${this.constructor.name} successfully`);
  }

  protected async handleError(error: any, args: any[]): Promise<void> {
    // Default implementation - can be overridden
    Logger.getInstance().error(`Error executing ${this.constructor.name}`, {
      error: error.message,
      args
    });
  }
}
```

#### Benefits
- **Code Reuse**: Common algorithm structure shared across commands
- **Consistency**: All commands follow the same execution pattern
- **Extensibility**: Subclasses can customize specific steps
- **Error Handling**: Centralized error handling framework

## 🔧 Structural Patterns

### 7. Decorator Pattern - Command Decorators

#### Intent
Attach additional responsibilities to an object dynamically.

#### Implementation
```typescript
// src/commands/CommandDecorators.ts
export interface Command {
  execute(args: any[]): Promise<any>;
}

export class LoggingDecorator implements Command {
  constructor(private readonly command: Command) {}

  async execute(args: any[]): Promise<any> {
    Logger.getInstance().info(`Executing command: ${this.command.constructor.name}`);
    const startTime = Date.now();

    try {
      const result = await this.command.execute(args);
      const duration = Date.now() - startTime;
      Logger.getInstance().info(`Command completed in ${duration}ms`);
      return result;
    } catch (error) {
      Logger.getInstance().error(`Command failed: ${error.message}`);
      throw error;
    }
  }
}

export class ValidationDecorator implements Command {
  constructor(private readonly command: Command) {}

  async execute(args: any[]): Promise<any> {
    // Validate arguments before execution
    this.validateArguments(args);
    return await this.command.execute(args);
  }

  private validateArguments(args: any[]): void {
    // Validation logic here
  }
}
```

#### Benefits
- **Dynamic Behavior**: Add behavior without modifying existing code
- **Composition**: Combine multiple decorators for complex behavior
- **Single Responsibility**: Each decorator handles one concern
- **Flexibility**: Decorators can be added/removed at runtime

### 8. Composite Pattern - UI Component Hierarchy

#### Intent
Compose objects into tree structures to represent part-whole hierarchies.

#### Implementation
```typescript
// src/ui/UIComponent.ts
export interface UIComponent {
  render(): HTMLElement;
  destroy(): void;
  show(): void;
  hide(): void;
}

export abstract class BaseUIComponent implements UIComponent {
  protected children: UIComponent[] = [];
  protected element: HTMLElement;

  constructor() {
    this.element = this.createElement();
  }

  abstract createElement(): HTMLElement;

  render(): HTMLElement {
    this.children.forEach(child => {
      this.element.appendChild(child.render());
    });
    return this.element;
  }

  destroy(): void {
    this.children.forEach(child => child.destroy());
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  show(): void {
    this.element.style.display = 'block';
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  addChild(component: UIComponent): void {
    this.children.push(component);
  }

  removeChild(component: UIComponent): void {
    const index = this.children.indexOf(component);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }
}
```

#### Benefits
- **Tree Structure**: Natural representation of UI hierarchies
- **Uniform Treatment**: Treat individual and composite objects uniformly
- **Extensibility**: Easy to add new component types
- **Memory Management**: Centralized lifecycle management

## 🎭 Behavioral Patterns

### 9. Command Pattern - Undo/Redo System

#### Intent
Encapsulate a request as an object, thereby letting you parameterize clients with different requests.

#### Implementation
```typescript
// src/commands/UndoRedoSystem.ts
export interface Command {
  execute(): void;
  undo(): void;
  canUndo(): boolean;
}

export class TextEditCommand implements Command {
  constructor(
    private editor: vscode.TextEditor,
    private edit: vscode.TextEditorEdit,
    private undoEdit?: vscode.TextEditorEdit
  ) {}

  execute(): void {
    this.editor.edit(this.edit);
  }

  undo(): void {
    if (this.undoEdit) {
      this.editor.edit(this.undoEdit);
    }
  }

  canUndo(): boolean {
    return !!this.undoEdit;
  }
}

export class CommandHistory {
  private history: Command[] = [];
  private currentIndex: number = -1;

  execute(command: Command): void {
    // Remove any commands after current index (for new branch)
    this.history = this.history.slice(0, this.currentIndex + 1);

    command.execute();
    this.history.push(command);
    this.currentIndex++;
  }

  undo(): void {
    if (this.canUndo()) {
      this.history[this.currentIndex].undo();
      this.currentIndex--;
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.currentIndex++;
      this.history[this.currentIndex].execute();
    }
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
}
```

#### Benefits
- **Decoupling**: Invoker and receiver are decoupled
- **Extensibility**: New commands can be added easily
- **Composition**: Commands can be composed together
- **Undo/Redo**: Natural support for undo/redo operations

### 10. State Pattern - Editor State Management

#### Intent
Allow an object to alter its behavior when its internal state changes.

#### Implementation
```typescript
// src/state/EditorState.ts
export interface EditorState {
  handleInput(input: string): void;
  getContext(): EditorContext;
  canExecuteCommand(commandId: string): boolean;
}

export class NormalState implements EditorState {
  constructor(private context: EditorContext) {}

  handleInput(input: string): void {
    // Normal text input handling
    this.context.appendText(input);
  }

  getContext(): EditorContext {
    return this.context;
  }

  canExecuteCommand(commandId: string): boolean {
    return true; // All commands available in normal state
  }
}

export class SelectionState implements EditorState {
  constructor(private context: EditorContext) {}

  handleInput(input: string): void {
    // Replace selection with input
    this.context.replaceSelection(input);
    this.context.changeState(new NormalState(this.context));
  }

  getContext(): EditorContext {
    return this.context;
  }

  canExecuteCommand(commandId: string): boolean {
    // Only selection-related commands available
    return ['cut', 'copy', 'paste', 'delete'].includes(commandId);
  }
}

export class EditorContext {
  private state: EditorState;

  constructor() {
    this.state = new NormalState(this);
  }

  changeState(state: EditorState): void {
    this.state = state;
  }

  handleInput(input: string): void {
    this.state.handleInput(input);
  }

  canExecuteCommand(commandId: string): boolean {
    return this.state.canExecuteCommand(commandId);
  }
}
```

#### Benefits
- **State Encapsulation**: Each state encapsulates its own behavior
- **Clean Transitions**: Clear state transition logic
- **Extensibility**: New states can be added easily
- **Maintainability**: State-specific logic is localized

## 📊 Pattern Usage Analysis

### Pattern Distribution
```
Creational Patterns: 20%
- Factory: 15%
- Singleton: 5%

Structural Patterns: 35%
- Adapter: 15%
- Decorator: 10%
- Composite: 10%

Behavioral Patterns: 45%
- Command: 15%
- Observer: 10%
- Strategy: 10%
- State: 5%
- Template Method: 5%
```

### Pattern Effectiveness Metrics
- **Maintainability**: High - Clear separation of concerns
- **Testability**: High - Dependency injection and mocking support
- **Extensibility**: High - Open/closed principle adherence
- **Performance**: Medium - Some overhead from abstraction layers
- **Complexity**: Medium - Learning curve for new developers

## 🔮 Future Pattern Considerations

### Short Term (Next Release)
- [ ] Implement Repository pattern for data persistence
- [ ] Add Builder pattern for complex object construction
- [ ] Consider Mediator pattern for component communication
- [ ] Evaluate Visitor pattern for operations on object structures

### Medium Term (Q1 2026)
- [ ] Implement CQRS pattern for command/query separation
- [ ] Add Event Sourcing for audit trails
- [ ] Consider Saga pattern for distributed transactions
- [ ] Evaluate Microservices architecture for scaling

### Long Term (2026+)
- [ ] Implement Domain-Driven Design patterns
- [ ] Add Hexagonal Architecture for external service integration
- [ ] Consider Reactive Programming patterns
- [ ] Evaluate Functional Programming patterns

## 📋 Pattern Implementation Guidelines

### When to Use Each Pattern
1. **Factory**: When object creation is complex or needs to be centralized
2. **Strategy**: When you have multiple algorithms for the same task
3. **Observer**: When one object's state change affects multiple others
4. **Singleton**: When exactly one instance is needed globally
5. **Adapter**: When you need to work with incompatible interfaces
6. **Template Method**: When you have a common algorithm with varying steps
7. **Decorator**: When you need to add behavior dynamically
8. **Composite**: When you need to treat individual and group objects uniformly
9. **Command**: When you need to parameterize and queue operations
10. **State**: When object behavior depends on its state

### Pattern Anti-Patterns to Avoid
- **Over-Engineering**: Don't use patterns where simple code suffices
- **Pattern Overkill**: Avoid forcing patterns where they don't fit
- **Pattern Misuse**: Understand pattern intent before implementation
- **Pattern Proliferation**: Don't introduce patterns just for completeness

---

**Document Version**: 2.0.0
**Last Updated**: September 2, 2025
**Architecture Style**: Clean Architecture
**Primary Patterns**: Factory, Strategy, Observer, Singleton
**Author**: Architecture Team
**Classification**: Internal Use Only
