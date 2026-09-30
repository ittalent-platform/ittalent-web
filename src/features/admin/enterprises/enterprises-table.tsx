import { Link, useNavigate } from "react-router";
import { Building2, Eye, MoreVertical, Pencil, Search, Trash2, Ban, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EnterpriseAvatar,
  EnterpriseStatusBadge,
  formatEnterpriseId,
} from "./enterprise-badges";
import type { EnterpriseSummaryDto } from "./enterprises.queries";

type EnterprisesTableProps = {
  items: EnterpriseSummaryDto[];
  isLoading: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  onSuspend: (item: EnterpriseSummaryDto) => void;
  onActivate: (item: EnterpriseSummaryDto) => void;
  onDelete: (item: EnterpriseSummaryDto) => void;
};

export function EnterprisesTable({
  items,
  isLoading,
  hasFilters,
  onClearFilters,
  onSuspend,
  onActivate,
  onDelete,
}: EnterprisesTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-[#e6e4df] overflow-hidden">
        <div className="divide-y divide-[#efede8]">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="w-16 h-4 rounded" />
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-48 h-4 rounded" />
                <Skeleton className="w-32 h-3 rounded" />
              </div>
              <Skeleton className="w-28 h-4 rounded" />
              <Skeleton className="w-20 h-6 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    if (hasFilters) {
      return (
        <div className="rounded-2xl bg-white border border-[#e6e4df] p-12 flex flex-col items-center justify-center text-center gap-3">
          <span className="w-14 h-14 rounded-full bg-[#f1efea] text-[#8a8a91] flex items-center justify-center mb-1">
            <Search className="w-6 h-6" />
          </span>
          <h3 className="font-['Space_Grotesk'] text-lg font-semibold text-[#19191c]">
            No matching enterprises
          </h3>
          <p className="text-sm text-[#64646b] max-w-sm leading-relaxed">
            No enterprises match your active filters or keyword search. Try another search term or reset filters.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onClearFilters}
            className="mt-2 h-10 px-5 rounded-xl border-[#e6e4df] text-sm font-semibold hover:bg-muted/40"
          >
            Clear filters
          </Button>
        </div>
      );
    }

    return (
      <div className="rounded-2xl bg-white border border-[#e6e4df] p-12 flex flex-col items-center justify-center text-center gap-3">
        <span className="w-14 h-14 rounded-full bg-[#f1efea] text-[#8a8a91] flex items-center justify-center mb-1">
          <Building2 className="w-6 h-6" />
        </span>
        <h3 className="font-['Space_Grotesk'] text-lg font-semibold text-[#19191c]">
          No enterprise profiles yet
        </h3>
        <p className="text-sm text-[#64646b] max-w-sm leading-relaxed">
          Create a profile for each company that passed offline legal and business vetting.
        </p>
        <Button
          type="button"
          onClick={() => navigate("/admin/enterprises/new")}
          className="mt-2 h-11 px-6 rounded-full bg-[#f2470c] hover:bg-[#d93d07] text-white text-sm font-semibold shadow-sm"
        >
          Create enterprise
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-[#e6e4df] overflow-x-auto shadow-2xs">
      <table className="w-full text-left text-[13.5px] border-collapse min-w-[980px]">
        <thead className="bg-[#f6f5f1] border-b border-[#e6e4df] text-[11.5px] font-bold tracking-wider text-[#6f6f76] uppercase select-none">
          <tr>
            <th className="py-3.5 px-5 whitespace-nowrap">ID</th>
            <th className="py-3.5 px-5 whitespace-nowrap">Enterprise</th>
            <th className="py-3.5 px-5 whitespace-nowrap">Industry</th>
            <th className="py-3.5 px-5 whitespace-nowrap">Size</th>
            <th className="py-3.5 px-5 whitespace-nowrap">Location</th>
            <th className="py-3.5 px-5 whitespace-nowrap">Status</th>
            <th className="py-3.5 px-4 w-12 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#efede8] text-[#19191c]">
          {items.map((ent) => {
            const formattedId = formatEnterpriseId(ent.id);
            const isActive = ent.status?.toLowerCase() === "active";

            return (
              <tr
                key={ent.id}
                className="hover:bg-[#fafaf8] transition-colors group"
              >
                {/* ID */}
                <td className="py-4 px-5 align-middle">
                  <Link
                    to={`/admin/enterprises/${ent.id}`}
                    className="font-mono text-xs font-semibold text-[#64646b] hover:text-[#f2470c] transition"
                  >
                    {formattedId}
                  </Link>
                </td>

                {/* Enterprise Name & City */}
                <td className="py-4 px-5 align-middle">
                  <Link
                    to={`/admin/enterprises/${ent.id}`}
                    className="flex items-center gap-3 no-underline group/link"
                  >
                    <EnterpriseAvatar
                      name={ent.name}
                      logoUrl={ent.logoUrl}
                      size="md"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[14px] text-[#19191c] group-hover/link:text-[#f2470c] transition truncate">
                        {ent.name}
                      </span>
                      {ent.shortDescription ? (
                        <span className="text-xs text-[#64646b] truncate max-w-[280px]">
                          {ent.shortDescription}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </td>

                {/* Industry */}
                <td className="py-4 px-5 align-middle whitespace-nowrap text-sm">
                  {ent.industry ?? "—"}
                </td>

                {/* Size */}
                <td className="py-4 px-5 align-middle whitespace-nowrap text-sm text-[#4a4a50]">
                  {ent.companySize ?? "—"}
                </td>

                {/* Location */}
                <td className="py-4 px-5 align-middle whitespace-nowrap text-sm text-[#4a4a50]">
                  {ent.location ?? "—"}
                </td>

                {/* Status */}
                <td className="py-4 px-5 align-middle whitespace-nowrap">
                  <EnterpriseStatusBadge status={ent.status} />
                </td>

                {/* Actions Dropdown */}
                <td className="py-4 px-4 align-middle text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Actions for ${ent.name}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64646b] hover:text-[#19191c] hover:bg-black/5 transition cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-xl bg-white border border-[#e6e4df] shadow-xl text-sm"
                    >
                      <DropdownMenuItem
                        onClick={() => navigate(`/admin/enterprises/${ent.id}`)}
                        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-[#64646b]" />
                        <span>View detail</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(`/admin/enterprises/${ent.id}/edit`)}
                        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 text-[#64646b]" />
                        <span>Edit profile</span>
                      </DropdownMenuItem>

                      {isActive ? (
                        <DropdownMenuItem
                          onClick={() => onSuspend(ent)}
                          variant="destructive"
                          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                        >
                          <Ban className="w-4 h-4" />
                          <span>Suspend</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onActivate(ent)}
                          variant="success"
                          className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Activate</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => onDelete(ent)}
                        variant="destructive"
                        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
