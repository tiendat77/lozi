---
name: angular-conventions
description: Guidelines and conventions for front-end development, specifically formatting, naming, styling, RxJS patterns, and HTML templates in Angular.
---

# Angular Frontend Coding Conventions

This skill guides you on the coding standards, rules, and conventions for the project. Always adhere strictly to these rules to maintain consistency, readability, and performance.

---

## 🏗️ General Standards

- **Indentation:** Always use spaces to indent. Exactly 2 spaces per indentation level.
- **Single Definition per File:** Define exactly one service, component, interface, class, or model per file.
- **Casing:** Use `camelCase` for variable and function names. Use `PascalCase` for classes, interfaces, and types. Use `UPPER_SNAKE_CASE` for constants.
- **Properties vs Methods Order:** Always place properties at the top of a class, followed by the constructor / DI, followed by the methods.
- **Member Accessibility Order:** Place public members first, then private members. Alphabetize each section to maintain order.
- **Keyword Preference:** Prefer `const` over `let`. Never use `var`.

---

## 🔷 Dependency Injection

While the codebase is moving towards using the `inject()` function, if you must use or maintain a constructor-based dependency injection, format it on a **single line** rather than wrapping each parameter on a new line.

### Good
```typescript
class StoreComponent {
  constructor(private http: HttpClient, private router: Router, public dialog: MatDialog, private cdr: ChangeDetectorRef) {}
}
```

### Bad
```typescript
class StoreComponent {
  constructor(
    private http: HttpClient,
    private router: Router,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }
}
```

---

## 📦 Clean Imports

Always clean up and organize imports. Group them by folder/functionality with a blank line between groups. The preferred order is:
1. Angular Core & Framework Modules
2. RxJS & Operators
3. Services
4. Models / Interfaces
5. Utilities / Third-party libraries

### Example
```typescript
// Angular
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';

// RxJS
import { BehaviorSubject, of, Subject } from 'rxjs';
import { catchError, debounceTime, filter, skip, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';

// Services
import { AuthService } from 'app/core/auth/auth.service';
import { StoreService } from './store.service';

// Models
import { Store, Employee } from 'app/core/models';

// Utils
import * as moment from 'moment';
```

---

## 🏷️ Naming Conventions & Member Prefixes

- **Observables:** Suffix all Observables with `$` (e.g., `heros$`, `destroy$`).
- **Private Members:** Prefix all private properties and methods with an underscore `_` (e.g., `private _heros$`, `private _getHeros()`).
- **File & Directory Names:** Must be in all lowercase. Use dot separation to describe features:
  - Component: `my-feature.component.ts`
  - Service: `my-service.service.ts`
- **Variable/Function Names:** Must be highly descriptive and use meaningful names. Prefer **clarity over brevity**.
  - Good: `divide(dividend, divisor)`
  - Bad: `div(x, y)`

---

## 🧼 Code Hygiene

- **Small Pure Functions:** Keep functions small, pure, and clean. Abstract logic into a new function if it starts getting long or cluttered.
- **Avoid Code Comments:** Try to avoid comments. Code should be self-explanatory. Let the code speak for itself. Inaccurate comments are worse than no comments at all.
  > "Code never lies, comments do."

---

## 📄 HTML Format & Attribute Ordering

### Line-Wrapping
Wrap attributes on separate lines when they grow too long or to improve readability.

### Good
```html
<input
       matInput required
       type="text" autocomplete="off"
       formControlName="value"
       mask="separator.2"
       thousandSeparator=","
       [validation]="false"
       [dropSpecialCharacters]="true"
       [blsMaxNumber]="100"
/>
```

### Bad
```html
<input matInput type="text" autocomplete="off" required [blsMaxNumber]="100" mask="separator.2" thousandSeparator="," [dropSpecialCharacters]="true" [validation]="false" formControlName="value" />
```

### Attribute Grouping & Order
Order the attributes and bindings on HTML elements according to this hierarchy:
1. **Structural Directives** (e.g., `*ngIf`, `*ngFor` or native `@if`/`@for` controls)
2. **Animation Triggers** (e.g., `@fade`, `[@fade]`)
3. **Element Reference** (e.g., `#myComponent`)
4. **HTML Attributes** (e.g., `class`, etc.)
5. **Non-interpolated String Inputs/Attributes** (e.g., `foo="bar"`)
6. **Interpolated/Property Bindings** (e.g., `[bar]="theBar"`)
7. **Two-Way Bindings** (e.g., `[(ngModel)]="fooBar"`)
8. **Outputs** (e.g., `(click)="onClick()"`, `(someEvent)="onSomeEvent($event)"`)

### Example
```html
<my-app-component
  *ngIf="shouldShow"
  @fade
  #myComponent
  class="foo"
  foo="bar"
  [bar]="theBar"
  [(ngModel)]="fooBar"
  (click)="onClick($event)"
  (someEvent)="onSomeEvent($event)"
></my-app-component>
```

---

## 🌀 RxJS Patterns

### Pipeable Operators Formatting
Place each operator on a separate line within the `.pipe()` block:
```typescript
const name = this.loadEmployees()
  .pipe(
    map(employee => employee.name),
    catchError(error => of(null))
  );
```

### Avoid Memory Leaks
Failing to unsubscribe will lead to memory leaks. When subscribing inside a component, use `takeUntil(this._destroy$)` or compose subscriptions cleanly.
```typescript
private _destroyed$ = new Subject<void>();

this.itemService.findItems()
  .pipe(
    map(value => value.item),
    takeUntil(this._destroyed$)
  )
  .subscribe();

ngOnDestroy(): void {
  this._destroyed$.next();
  this._destroyed$.complete();
}
```

### Don't Use Nested Subscriptions
Avoid subscribing inside subscriptions. Use operators like `switchMap`, `flatMap`, `forkJoin`, or `combineLatest` to chain streams:
```typescript
// Good
this.returnsObservable1(...)
  .pipe(
    flatMap(success => this.returnsObservable2(...)),
    flatMap(success => this.returnsObservable3(...))
  )
  .subscribe(success => { ... });
```
