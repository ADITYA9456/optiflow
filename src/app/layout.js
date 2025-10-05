import "./globals.css";

export const metadata = {
  title: "OptiFlow - Workflow Optimization Tool",
  description: "Optimize your workflow with AI-powered task management and productivity insights",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
