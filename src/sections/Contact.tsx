import { filled } from "@/lib/todo";
import { SectionShell, type SectionProps } from "./shared";

/**
 * Scene 8 — Signal Station. The server renders the dish + social buttons; the form itself
 * is passed in as `form` (a small client component that posts to /api/contact).
 */
export function Contact({ ctx, section, form }: SectionProps<"contact"> & { form?: React.ReactNode }) {
  const { site } = ctx;
  const links = site.socials.filter((s) => filled(s.url));
  return (
    <SectionShell section={section}>
      <div className="grid items-start gap-10 md:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
        <div data-reveal>
          <div className="signal-dish relative mx-auto mb-8 aspect-square w-40 md:mx-0" aria-hidden>
            <span className="signal-ring" />
            <span className="signal-ring [animation-delay:1s]" />
            <span className="signal-ring [animation-delay:2s]" />
            <span className="absolute inset-[32%] rounded-full bg-gradient-to-br from-cyan to-violet shadow-[0_0_40px_var(--cyan)]" />
          </div>
          <ul className="flex flex-wrap gap-3">
            {links.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  className="btn btn-ghost"
                  {...(s.magnetic ? { "data-magnetic": "" } : {})}
                  {...(s.kind === "email" ? { "data-event": "email-click" } : { target: "_blank", rel: "noopener noreferrer" })}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass p-5 md:p-7" data-reveal>
          {form}
        </div>
      </div>
    </SectionShell>
  );
}
