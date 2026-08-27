---
name: angular-aria
description: Implement accessible components in Angular v21+ using @angular/aria directives. Covers WAI-ARIA Authoring Practices patterns, headless components, keyboard navigation, ARIA roles/states, focus management, screen reader announcements, RTL support, and common patterns like autocomplete, listbox, select, combobox, menu, toolbar, accordion, tabs, tree, and grid.
---

# Angular Aria (v21) - Skill Guide for Agents

## Overview

**Angular Aria** is a new official package introduced in **Angular v21** (launched November 2025). It provides a collection of **headless, accessible directives** that implement common **WAI-ARIA Authoring Practices** (APG) patterns.

The directives handle the complex accessibility concerns:

- Keyboard interactions and navigation
- Proper ARIA roles, states, and properties
- Focus management
- Screen reader announcements
- RTL (right-to-left) support

**You (the developer/agent) only provide:**

- HTML structure
- CSS / Tailwind / SCSS styling
- Business logic

Angular Aria takes care of making the component WCAG-compliant and accessible by default.

**Official Documentation:** [https://angular.dev/guide/aria/overview](https://angular.dev/guide/aria/overview)

## Installation

```bash
npm install @angular/aria
```

Then import the needed directives in your standalone component or module:

```ts
import {
  Autocomplete,
  Listbox,
  Select,
  Multiselect,
  Combobox,
  Menu,
  Menubar,
  Toolbar,
  Accordion,
  Tabs,
  Tree,
  Grid,
  // Services if needed
} from '@angular/aria';
```

## Core Philosophy

- **Headless**: No default styles. Full design control.
- **Accessible by default**: Correct ARIA + keyboard + focus + announcements built-in.
- Best suited for:
  - Design systems / component libraries
  - Enterprise apps with custom branding
  - Teams that need full styling freedom while staying accessible

## Available Patterns & Directives

### 1. Search and Selection

| Directive      | Purpose                                  | Typical Use Case                      |
| -------------- | ---------------------------------------- | ------------------------------------- |
| `Autocomplete` | Text input with filtered suggestions     | Search with dropdown suggestions      |
| `Listbox`      | Single or multi-select option list       | Custom dropdown lists                 |
| `Select`       | Single-selection dropdown                | Custom `<select>` replacement         |
| `Multiselect`  | Multiple-selection dropdown              | Tag/multi-choice inputs               |
| `Combobox`     | Primitive for coordinating input + popup | Building custom autocomplete/combobox |

### 2. Navigation and Call to Actions

| Directive | Purpose                                    | Typical Use Case               |
| --------- | ------------------------------------------ | ------------------------------ |
| `Menu`    | Dropdown menus with nested submenus        | Context menus, action menus    |
| `Menubar` | Horizontal application menu bar            | Top-level app navigation menus |
| `Toolbar` | Grouped controls with logical keyboard nav | Toolbars with buttons/icons    |

### 3. Content Organization

| Directive   | Purpose                                    | Typical Use Case                  |
| ----------- | ------------------------------------------ | --------------------------------- |
| `Accordion` | Collapsible content panels                 | FAQ sections, settings panels     |
| `Tabs`      | Tabbed interfaces (auto/manual activation) | Content switching tabs            |
| `Tree`      | Hierarchical expandable lists              | File explorers, nested navigation |
| `Grid`      | 2D keyboard-navigable data grid            | Data tables with cell navigation  |

## Supporting Services & Utilities

- **`LiveAnnouncer`** — Announce dynamic messages to screen readers.
- **`AriaDescriber`** — Associate descriptive text with elements via ARIA.
- **`FocusMonitor`** — Monitor and react to focus changes.
- **`FocusTrap`** — Trap focus inside modals, dialogs, etc.
- **`HighContrastModeDetector`** — Detect OS/browser high-contrast mode and adapt UI.

**Usage example (LiveAnnouncer):**

```ts
import { LiveAnnouncer } from '@angular/aria';

@Component({...})
export class MyComponent {
  constructor(private liveAnnouncer: LiveAnnouncer) {}

  announceSuccess() {
    this.liveAnnouncer.announce('Operation completed successfully', 'polite');
  }
}
```

## Best Practices When Working with Angular Aria

1. **Always use the provided directives** instead of manually adding ARIA attributes when the pattern exists.
2. **Provide semantic HTML structure** — the directives expect certain element hierarchies (e.g., `<ul>`/`<li>` for listbox, proper tab/tabpanel pairing, etc.).
3. **Style freely** — Use Tailwind, CSS modules, or any styling solution. Angular Aria does not interfere with styles.
4. **Combine with Angular's native a11y support**:
   - `[attr.aria-label]`, `[attr.aria-describedby]`, etc.
   - Proper `label`/`for` associations.
5. **Test thoroughly**:
   - Keyboard navigation (Tab, Arrow keys, Enter, Escape, etc.)
   - Screen readers (NVDA, VoiceOver, TalkBack)
   - High-contrast mode
6. **For custom components** not covered by Angular Aria, fall back to Angular's general accessibility best practices (see `/best-practices/a11y`).

## When to Use Angular Aria vs Alternatives

- **Use Angular Aria** → When building a design system or need maximum styling control + guaranteed accessibility.
- **Use Angular Material** → When you want beautiful, pre-styled, accessible components quickly.
- **Use plain HTML + manual ARIA** → Only for very simple cases.

## Agent Tips for Working with Angular Aria

- **Read the specific pattern guide** first (e.g., `https://angular.dev/guide/aria/toolbar`, `https://angular.dev/guide/aria/grid`, etc.) — they contain detailed usage, required structure, and examples.
- Pay close attention to **required child directives** and **input properties** for activation modes (e.g., Tabs has auto vs manual activation).
- When implementing complex components, start with the official example/skin showcase if available.
- Prefer **declarative directive usage** over imperative code for accessibility logic.

## Related Resources

- Main Overview: https://angular.dev/guide/aria/overview
- General Angular Accessibility Best Practices: https://angular.dev/best-practices/a11y
- Individual Pattern Guides (Autocomplete, Menu, Grid, etc.)
- Angular v21 Announcement (for context)
