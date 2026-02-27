import React, { useEffect, useMemo } from "react";
import { Input, Select, TextArea } from "../../../components/ui/Input";
import { GROUPS, SPAIN_PROVINCES } from "../../../constants";
import type { GroupKey } from "../../../types";
import type { CategoryRow } from "../eventsApi";

interface EventFormFieldsProps {
    formData: {
        name: string;
        group_key: string;

        /**
         * IMPORTANT:
         * MUST store UUID from categories.id (not label like "Nightlife")
         */
        category: string;

        city: string;
        province: string;

        date_mode: "date" | "text";
        date_start?: string;
        date_end?: string;
        date_text: string;

        short_description: string;
        image_url: string;
    };

    setFormData: (updater: any) => void;
    formErrors: Record<string, string>;

    /**
     * Categories from Supabase (table: categories)
     */
    categories: CategoryRow[];
}

export const EventFormFields: React.FC<EventFormFieldsProps> = ({
    formData,
    setFormData,
    formErrors,
    categories,
}) => {
    const groupCategories = useMemo(() => {
        return (categories || [])
            .filter((c) => c.is_active !== false && c.group_key === formData.group_key)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }, [categories, formData.group_key]);

    const handleGroupChange = (key: GroupKey) => {
        setFormData((prev: any) => {
            const nextCats = (categories || [])
                .filter((c) => c.is_active !== false && c.group_key === key)
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

            return {
                ...prev,
                group_key: key,
                category: nextCats[0]?.id ?? "",
            };
        });
    };

    // ✅ If current category is not valid for current group, auto-fix
    useEffect(() => {
        if (!categories || categories.length === 0) return;

        const validIds = new Set(groupCategories.map((c) => c.id));
        setFormData((prev: any) => {
            if (!prev.category) {
                return { ...prev, category: groupCategories[0]?.id ?? "" };
            }
            if (!validIds.has(prev.category)) {
                return { ...prev, category: groupCategories[0]?.id ?? "" };
            }
            return prev;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories, formData.group_key]);

    return (
        <div className="space-y-6">
            <Input
                label="Event Name"
                value={formData.name}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                error={formErrors.name}
                placeholder="e.g. Summer Night Festival"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Community / Brand"
                    value={formData.group_key}
                    onChange={(e) => handleGroupChange(e.target.value as GroupKey)}
                    options={GROUPS.map((g) => ({ label: g.label, value: g.key }))}
                    error={formErrors.group_key}
                    helperText="Select the movement this event belongs to"
                />

                <Select
                    label="Category"
                    value={formData.category}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, category: e.target.value }))}
                    options={[
                        { label: "Select category", value: "" },
                        ...groupCategories.map((c) => ({ label: c.label, value: c.id })),
                    ]}
                    error={formErrors.category}
                    helperText="Category must be a valid UUID from Supabase"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="City / Town"
                    value={formData.city}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, city: e.target.value }))}
                    error={formErrors.city}
                    placeholder="e.g. Madrid"
                />

                <Select
                    label="Province"
                    value={formData.province}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, province: e.target.value }))}
                    options={[
                        { label: "Select Province", value: "" },
                        ...SPAIN_PROVINCES.map((p) => ({ label: p, value: p })),
                    ]}
                    error={formErrors.province}
                />
            </div>

            <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl space-y-4">
                <div className="flex items-center gap-4">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Date Mode
                    </label>
                    <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setFormData((prev: any) => ({ ...prev, date_mode: "date" }))}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.date_mode === "date" ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            Calendar Date
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData((prev: any) => ({ ...prev, date_mode: "text" }))}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${formData.date_mode === "text" ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            Custom Text
                        </button>
                    </div>
                </div>

                {formData.date_mode === "date" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.date_start || ""}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, date_start: e.target.value }))}
                            error={formErrors.date_start}
                        />
                        <Input
                            label="End Date (Optional)"
                            type="date"
                            value={formData.date_end || ""}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, date_end: e.target.value }))}
                            error={formErrors.date_end}
                            helperText="Set if event lasts multiple days"
                        />
                    </div>
                ) : (
                    <Input
                        label="Date Description"
                        value={formData.date_text}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, date_text: e.target.value }))}
                        error={formErrors.date_text}
                        placeholder="e.g. Next Saturday, or Coming July 2026"
                        helperText="Use this for TBD dates or approximate times"
                    />
                )}
            </div>

            <TextArea
                label="Event Description"
                rows={4}
                value={formData.short_description}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, short_description: e.target.value }))}
                error={formErrors.short_description}
                placeholder="Provide a brief overview of what makes this event special..."
            />

            <Input
                label="Image URL (Optional)"
                value={formData.image_url}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://..."
                helperText="Direct link to a poster or venue image"
            />
        </div>
    );
};
