"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  categoryDisplay,
  contentActionLabel,
  contentDescription,
  contentTitle,
  referenceFromItem,
  referenceHref,
  referenceLabel,
  resourceTypeDisplay,
  type ContentItem,
} from "@/lib/content-library";
import { Icon } from "@/components/Icon";

/**
 * One card in the Studies / Resources listing.
 *
 * Everything that makes the card useful on a phone is deliberate:
 *   • the whole call-to-action is a full-width button, so external links
 *     (Google Drive, PDF, video…) are obvious and easy to hit with a thumb;
 *   • links always open in a new tab with `rel="noopener noreferrer"`, so a
 *     PDF or Drive folder never replaces the app that hosts it;
 *   • the Bible reference chip is a LINK to the sibling section filtered by
 *     that reference — from a study it opens "the resources for Psalms 23",
 *     from a resource "the studies for Psalms 23". Pass
 *     `showReferenceLink={false}` when the surrounding block is already
 *     scoped to one reference (see RelatedContent).
 *
 * Cover images use a plain <img>: a servant may paste a Drive/host URL that is
 * not in next.config.ts `images.remotePatterns`, and next/image would refuse to
 * render it. Loading is lazy, so the list stays light on mobile data.
 */
export default function ContentCard({
  item,
  allItems,
  showReferenceLink = true,
}: {
  item: ContentItem;
  /** All loaded items — used to resolve an optional related study's title. */
  allItems: ContentItem[];
  showReferenceLink?: boolean;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("content");

  const title = contentTitle(item, isAr);
  const description = contentDescription(item, isAr);
  const action = contentActionLabel(item, isAr);
  const category = categoryDisplay(item.category, item.type, isAr);
  const format = item.type === "resource" ? resourceTypeDisplay(item, isAr) : null;
  const reference = referenceFromItem(item);
  const refLabel = referenceLabel(reference, isAr);
  const siblingSection = item.type === "study" ? "resources" : "studies";

  const relatedStudy = item.related_study_id
    ? allItems.find((candidate) => candidate.id === item.related_study_id && candidate.type === "study")
    : undefined;

  return (
    <article className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" loading="lazy" className="h-36 w-full object-cover" />
      )}

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <Icon name={format?.icon ?? category?.icon ?? (item.type === "study" ? "book" : "menu")} size={24} className="text-coral" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-snug text-navy">{title}</h2>
            {description && (
              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-navy/70">{description}</p>
            )}
          </div>
        </div>

        {(category || format || refLabel || relatedStudy) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {category && (
              <span className="rounded-full bg-cream px-2.5 py-1 text-xs text-navy/75">
                <Icon name={category.icon} size={14} /> {category.label}
              </span>
            )}
            {format && (
              <span className="rounded-full bg-cream px-2.5 py-1 text-xs text-navy/75">
                <Icon name={format.icon} size={14} /> {format.label}
              </span>
            )}
            {refLabel && showReferenceLink && reference && (
              <Link
                href={referenceHref(locale, siblingSection, reference)}
                title={isAr ? `شاهد ${siblingSection === "studies" ? "الدراسات" : "الموارد"} المتعلقة بـ ${refLabel}` : `Show ${siblingSection === "studies" ? "studies" : "resources"} for ${refLabel}`}
                className="rounded-full bg-coral/15 px-2.5 py-1 text-xs font-semibold text-coral transition hover:bg-coral/25"
              >
                <Icon name="book" size={14} /> {refLabel} <Icon name="arrow" size={14} />
              </Link>
            )}
            {refLabel && !showReferenceLink && (
              <span className="rounded-full bg-coral/15 px-2.5 py-1 text-xs font-semibold text-coral">
                <Icon name="book" size={14} /> {refLabel}
              </span>
            )}
            {relatedStudy && (
              <a
                href={relatedStudy.url}
                target="_blank"
                rel="noopener noreferrer"
                title={isAr ? "افتح الدراسة المرتبطة" : "Open the related study"}
                className="rounded-full bg-butter px-2.5 py-1 text-xs text-navy transition hover:brightness-95"
              >
                <Icon name="book" size={14} /> {t("relatedStudy")}: {contentTitle(relatedStudy, isAr)}
              </a>
            )}
          </div>
        )}

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          title={t("openInNewTab")}
          className="focus-ring pressable flex items-center justify-center gap-2 rounded-xl bg-coral py-2.5 text-sm font-semibold text-navy transition hover:brightness-95 active:scale-[0.98]"
        >
          <Icon name={format?.icon ?? "arrow"} size={16} />
          {action}
          <span aria-hidden className="text-xs opacity-80">↗</span>
        </a>
      </div>
    </article>
  );
}
