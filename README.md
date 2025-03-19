Required dependencies
Base component structure
Configuration options
Example implementations

```
import { GaryWidget, createWidgetTheme } from 'gary-widget-toolkit';

// Project-specific theme
const projectTheme = createWidgetTheme({
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  // Other customizations
});

// In your page component
export default function PresalePage() {
  return (
    <div>
      <h1>Project Specific Content</h1>
      <GaryWidget 
        config={{
          theme: projectTheme,
          networkSettings: {
            defaultChain: 'polygon',
            supportedChains: ['polygon', 'bsc']
          },
          // Other project-specific settings
        }}
      />
    </div>
  );
}
```