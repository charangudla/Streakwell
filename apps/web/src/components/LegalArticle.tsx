type LegalArticleProps = {
  html: string;
};

export function LegalArticle({ html }: LegalArticleProps) {
  return (
    <article
      className="prose prose-slate max-w-none prose-headings:text-ink prose-headings:font-bold prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-lg prose-a:text-brand-700 prose-a:no-underline hover:prose-a:underline prose-strong:text-ink prose-li:text-ink-muted prose-p:text-ink-muted"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
