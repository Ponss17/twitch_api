import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
    isOpen?: boolean;
    onClick?: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onClick }) => {
    return (
        <div className="border-b border-border-strong last:border-none">
            <button
                type="button"
                className="group relative flex w-full items-center justify-center py-4 text-center outline-none transition-colors hover:text-primary focus-visible:text-primary"
                onClick={onClick}
                aria-expanded={isOpen}
            >
                <span className="text-[0.9375rem] font-medium text-text-main pr-6 pl-6">{title}</span>
                <ChevronDown
                    className={`absolute right-4 w-4 h-4 text-text-muted transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] ${
                        isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                    aria-hidden="true"
                />
            </button>
            <div
                className={`grid transition-all duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <div className="pb-4 text-center text-[0.875rem] leading-relaxed text-text-muted px-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface AccordionProps {
    items: { id: string; title: string; content: React.ReactNode }[];
    allowMultiple?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ items, allowMultiple = false }) => {
    const [openIds, setOpenIds] = useState<Set<string>>(new Set());

    const toggle = (id: string) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (!allowMultiple) next.clear();
                next.add(id);
            }
            return next;
        });
    };

    return (
        <div className="w-full rounded-xl border border-border-strong bg-bg-secondary px-5">
            {items.map((item) => (
                <AccordionItem
                    key={item.id}
                    title={item.title}
                    isOpen={openIds.has(item.id)}
                    onClick={() => toggle(item.id)}
                >
                    {item.content}
                </AccordionItem>
            ))}
        </div>
    );
};
