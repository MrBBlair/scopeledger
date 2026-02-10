# PM Budgeting Tool - Preview

This is a standalone preview of the PM Budgeting Tool application. It provides an interactive demonstration of the app's UI and features without requiring any backend services or authentication.

## Features Demonstrated

- **Dashboard**: Overview of active projects, total budgets, and recent projects
- **Projects List**: Complete list of all projects with status and budget information
- **Project Detail**: Comprehensive project view with multiple tabs:
  - **Overview**: Key metrics (total budget, cost to date, remaining budget, burn rate) and AI insights
  - **Costs**: List of project costs with categories, vendors, and amounts
  - **Change Orders**: Positive and negative change orders with approval workflow
  - **Forecast**: Current metrics and forecast snapshot functionality
  - **Logs**: Audit log entries with export capability

## How to Use

Simply open `index.html` in any modern web browser. No server or build process is required.

The preview includes:
- Interactive navigation between views
- Tab switching in project detail view
- Mock data showcasing real-world scenarios
- Responsive design matching the production app
- Complete UI components and styling

## Design System

The preview uses the same design system as the production app:
- **Fonts**: DM Sans (body) and Fraunces (headings)
- **Colors**: Brand blue (#0284c7) and slate grays
- **Components**: Cards, buttons, tabs, and navigation matching the production UI
- **Responsive**: Mobile-first design that works on all screen sizes

## Note

This is a static preview with mock data. It does not connect to Firebase, perform real calculations, or persist any data. All interactions are simulated for demonstration purposes.
