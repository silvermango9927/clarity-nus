import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

// One rendering pipeline for every surface (feed, detail page, editor preview).
// No "use client": this component renders on the server when imported by a
// Server Component and on the client when imported by a Client Component, so
// the three surfaces can never diverge.
//
// Raw HTML is intentionally NOT enabled (no rehype-raw), and react-markdown's
// default URL sanitization stays on — user-submitted Markdown cannot inject
// scripts or dangerous link protocols. See the F3 design spec, §6.

const REMARK_PLUGINS = [remarkGfm, remarkMath];

const REHYPE_PLUGINS = [
  // Bad/incomplete LaTeX (e.g. mid-typing in the live preview) renders as red
  // error text instead of throwing and crashing the whole render.
  [rehypeKatex, { throwOnError: false, errorColor: "#e55a48", strict: false }],
  // Unlabeled code blocks get a best-effort highlight; unknown languages
  // degrade to plain code rather than erroring.
  [rehypeHighlight, { detect: true, ignoreMissing: true }],
] as const;

// External links open in a new tab and are hardened against tab-nabbing.
const COMPONENTS: Components = {
  a({ href, children, ...props }) {
    const external = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
};

type Props = {
  source: string;
  className?: string;
};

export function Markdown({ source, className }: Props) {
  return (
    <div className={`clarity-prose${className ? ` ${className}` : ""}`}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        // react-markdown's plugin typings are stricter than the tuple form we
        // use for options; the runtime accepts [plugin, options] tuples.
        rehypePlugins={REHYPE_PLUGINS as never}
        components={COMPONENTS}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
