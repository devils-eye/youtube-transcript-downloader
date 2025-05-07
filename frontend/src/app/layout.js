import "./globals.css";
import ClientLayout from "./ClientLayout";
import { metadata } from "./metadata";

export { metadata };

export default function RootLayout({ children }) {
  return <ClientLayout>{children}</ClientLayout>;
}
