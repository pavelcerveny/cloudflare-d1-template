import { Footer } from '@/components/footer';

export default async function NavFooterLayout({
  children,
  renderFooter = true,
}: Readonly<{
  children: React.ReactNode;
  renderFooter?: boolean;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
      </main>
      {renderFooter && <Footer />}
    </div>
  );
}
