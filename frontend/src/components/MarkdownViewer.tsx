import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
}

export default function MarkdownViewer({ content }: Props) {
  return (
    <div className="prose prose-sm max-w-none text-left">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
