interface StatsSectionHeadingProps {
    title: string;
    description: string;
}

export function StatsSectionHeading({ title, description }: StatsSectionHeadingProps) {
    return (
        <div className="mb-2 mt-1 px-0.5">
            <h2 className="text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-[#71717a]">
                {title}
            </h2>
            <p className="mt-0.5 text-[0.82rem] text-[#c4c4cc]">{description}</p>
        </div>
    );
}
