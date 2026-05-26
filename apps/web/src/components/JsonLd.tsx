type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // Server-rendered, content controlled, safe to serialize.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
