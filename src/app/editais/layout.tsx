import { Layout } from "@/components/layout/Layout";
import { CommandBar } from "@/components/CommandBar";

export default function EditaisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandBar>
      <Layout variant="app">
        {children}
      </Layout>
    </CommandBar>
  );
}
