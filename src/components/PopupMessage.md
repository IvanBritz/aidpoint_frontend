# Popup Message System

A comprehensive and beautiful popup message system designed for the Financial Aid application, featuring multiple message types, auto-close functionality, and a clean, modern UI that matches your existing design patterns.

## Features

- ✅ **Multiple Message Types**: Success, Error, Warning, Info, and Confirm dialogs
- ✅ **Auto-close Support**: Optional automatic closing after specified time
- ✅ **Custom Icons**: Support for custom icons or use built-in ones
- ✅ **Responsive Design**: Works on mobile and desktop
- ✅ **Accessibility**: Full keyboard navigation and screen reader support
- ✅ **Smooth Animations**: Beautiful transitions using HeadlessUI
- ✅ **TypeScript Ready**: Full TypeScript support
- ✅ **Easy Integration**: Drop-in replacement for alert() and confirm()

## Components

### 1. PopupMessage Component
The main component for displaying popup messages.

### 2. usePopupMessage Hook
A convenient hook that manages popup state and provides easy-to-use methods.

## Installation

The components are already integrated into your project. Make sure you have the required dependencies:

```bash
npm install @headlessui/react @heroicons/react
```

## Basic Usage

### Using the Hook (Recommended)

```javascript
import { usePopupMessage } from '../hooks/usePopupMessage'

function MyComponent() {
    const { showSuccess, showError, showConfirm } = usePopupMessage()

    const handleSuccess = () => {
        showSuccess('Success!', 'Operation completed successfully')
    }

    const handleError = () => {
        showError('Error!', 'Something went wrong')
    }

    const handleConfirm = () => {
        showConfirm(
            'Delete Item', 
            'Are you sure you want to delete this item?',
            () => console.log('Item deleted!')
        )
    }

    return (
        <div>
            <button onClick={handleSuccess}>Show Success</button>
            <button onClick={handleError}>Show Error</button>
            <button onClick={handleConfirm}>Show Confirm</button>
        </div>
    )
}
```

### Direct Component Usage

```javascript
import PopupMessage from './PopupMessage'
import { useState } from 'react'

function MyComponent() {
    const [showPopup, setShowPopup] = useState(false)

    return (
        <div>
            <button onClick={() => setShowPopup(true)}>
                Show Popup
            </button>
            
            <PopupMessage
                isOpen={showPopup}
                type="success"
                title="Success!"
                message="Your operation was successful."
                onClose={() => setShowPopup(false)}
            />
        </div>
    )
}
```

## API Reference

### PopupMessage Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | false | Controls popup visibility |
| `onClose` | function | - | Called when popup is closed |
| `onConfirm` | function | - | Called when confirm button is clicked |
| `type` | string | 'info' | Message type: 'success', 'error', 'warning', 'info', 'confirm' |
| `title` | string | 'Message' | Popup title |
| `message` | string/JSX | '' | Popup message content |
| `confirmText` | string | 'OK' | Confirm button text |
| `cancelText` | string | 'Cancel' | Cancel button text |
| `showCancel` | boolean | false | Show cancel button |
| `autoClose` | number | null | Auto-close after X milliseconds |
| `icon` | Component | - | Custom icon component |
| `size` | string | 'md' | Popup size: 'sm', 'md', 'lg' |

### usePopupMessage Hook Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `showSuccess(title, message, options)` | title, message, options object | Show success message |
| `showError(title, message, options)` | title, message, options object | Show error message |
| `showWarning(title, message, options)` | title, message, options object | Show warning message |
| `showInfo(title, message, options)` | title, message, options object | Show info message |
| `showConfirm(title, message, onConfirm, options)` | title, message, callback, options | Show confirm dialog |
| `showWorkflowComplete(name, amount, options)` | beneficiary name, amount, options | Show workflow completion |
| `showProcessing(title, message, options)` | title, message, options | Show processing message |
| `closePopup()` | - | Close current popup |

## Usage Examples

### Success Messages

```javascript
// Basic success
showSuccess('Success!', 'Operation completed')

// Success with auto-close
showSuccess('Saved!', 'Document saved successfully', { autoClose: 2000 })

// Success with custom action
showSuccess('Uploaded!', 'File uploaded', {
    confirmText: 'View File',
    onConfirm: () => openFile()
})
```

### Error Messages

```javascript
// Basic error
showError('Error', 'Failed to save document')

// Error with details
showError('Upload Failed', 'File size too large. Maximum size is 10MB.')
```

### Confirmation Dialogs

```javascript
// Basic confirmation
showConfirm('Delete Item', 'Are you sure?', () => deleteItem())

// Custom confirmation with options
showConfirm('Approve Request', 'Approve this financial aid request?', 
    () => approveRequest(), 
    {
        confirmText: 'Approve',
        cancelText: 'Cancel',
        type: 'warning'
    }
)
```

### Custom Icons

```javascript
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

showSuccess('Payment Processed', 'Payment of ₱5,000 processed', {
    icon: CurrencyDollarIcon
})
```

### Auto-close Messages

```javascript
// Auto-close after 3 seconds
showSuccess('Saved!', 'Changes saved automatically', { autoClose: 3000 })

// Auto-close after 1 second
showInfo('Loading...', 'Please wait', { autoClose: 1000 })
```

### Financial Aid Specific Examples

```javascript
// Application approved
showSuccess(
    'Application Approved!', 
    'Your financial aid application has been approved. You will receive ₱5,000.'
)

// Document upload required
showWarning(
    'Documents Required',
    'Please upload your Certificate of Enrollment to continue with your application.'
)

// Workflow completion (matching your app's style)
showWorkflowComplete('Ma Hannah Narvasa', '5,000')

// Processing request
showProcessing(
    'Processing Application',
    'Please wait while we review your financial aid application...'
)
```

### Advanced Usage with JSX Content

```javascript
const CustomMessage = () => (
    <div>
        <p>Your application has been submitted successfully!</p>
        <ul className="mt-2 text-left">
            <li>• Application ID: FA2024-001</li>
            <li>• Amount Requested: ₱5,000</li>
            <li>• Expected Processing: 3-5 days</li>
        </ul>
    </div>
)

showSuccess('Application Submitted', <CustomMessage />)
```

## Styling

The components use Tailwind CSS and match your existing application design:

- **Colors**: Matches your blue theme with gradient backgrounds
- **Typography**: Uses your existing font families and sizes
- **Shadows**: Consistent with other modals in your app
- **Animations**: Smooth transitions using HeadlessUI
- **Responsive**: Works on all screen sizes

## Integration with Existing Code

Replace existing alert/confirm calls:

```javascript
// Before
alert('Success!')
if (confirm('Delete item?')) {
    deleteItem()
}

// After
showSuccess('Success!', 'Operation completed successfully')
showConfirm('Delete Item', 'Are you sure?', () => deleteItem())
```

## Demo

To see all the popup variations in action, add the demo component to your app:

```javascript
import PopupMessageDemo from './PopupMessageDemo'

// Add to your route or component
<PopupMessageDemo />
```

## Best Practices

1. **Use appropriate message types** for different scenarios
2. **Keep messages concise** but informative
3. **Use auto-close for success messages** but not for errors
4. **Always provide clear action buttons** for confirmations
5. **Test with screen readers** for accessibility
6. **Use consistent terminology** across your app

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Supports all screen sizes and orientations

This popup system integrates seamlessly with your Financial Aid application and provides a professional, consistent user experience across all interactions.