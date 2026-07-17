# NERMAI Component Library

The Component Library is a shared collection of UI components built on top of `@nermai/theme`.

## Core Components

### `ScreenContainer`
A wrapper component that handles `SafeAreaView`, `KeyboardAvoidingView`, and `ScrollView` uniformly across the app.
- **Props**: `scrollable` (boolean), `padding` (boolean).

### `PrimaryButton` / `SecondaryButton`
Standardized touchable elements.
- **Rules**: Height 56px, Radius 16px.
- **Props**: `title`, `onPress`, `loading`, `disabled`, `icon`.

### `TextField` / `PasswordField`
Form inputs.
- **Rules**: Height 56px, Radius 16px, inner padding 16px.
- **Props**: `label`, `placeholder`, `value`, `onChangeText`, `leftIcon`, `error`. `PasswordField` includes a built-in visibility toggle.

### `Card`
A versatile container for content.
- **Rules**: Radius 20px, internal padding 20px, background `#1B1B1B`.
- **Props**: `children`, `onPress`.

### `StatusChip`
Small indicator for statuses (e.g., LIVE, ENDED).
- **Rules**: Radius 8px, text size 12px.
- **Props**: `status` (string matching semantic colors).

## Best Practices
- Never build one-off buttons or inputs inside screens. Always import from the shared component library.
- If a component needs a variant (e.g., an outline button), add the variant to the core component rather than creating a new file.
