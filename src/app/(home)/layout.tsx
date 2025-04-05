import { auth } from "@/auth";
import { Header } from "@/components/navigation";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <section className="flex flex-col min-h-screen">
      <Header session={session} />
      {children}
    </section>
  );
}
