import { useCallback, useState } from "react";
import { Search, ShieldOff, UserCheck, UserCog, X } from "lucide-react";
import Card, { CardHeader } from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Pagination from "../../components/admin/Pagination.jsx";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import * as adminApi from "../../api/admin.js";
import { useAsync } from "../../hooks/useAsync.js";
import { useDebounced } from "../../hooks/useDebounced.js";
import { useAuth } from "../../context/authContext.js";
import { useToast } from "../../context/toastContext.js";
import { formatShort } from "../../lib/dates.js";

const LIMIT = 20;
const ROLES = [
  { value: "", label: "All roles" },
  { value: "user", label: "Users" },
  { value: "admin", label: "Admins" },
];

export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [pending, setPending] = useState(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(
    () =>
      adminApi.listUsers({
        page,
        limit: LIMIT,
        ...(role ? { role } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      }),
    [page, role, debouncedSearch]
  );

  const { data, loading, error, reload } = useAsync(load);
  const users = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  async function onConfirm() {
    setWorking(true);
    try {
      if (pending.kind === "role") await adminApi.setUserRole(pending.user.id, pending.value);
      else await adminApi.setUserStatus(pending.user.id, pending.value);

      toast.success(`${pending.user.name} updated.`);
      setPending(null);
      reload();
    } catch (apiError) {
      toast.error(apiError.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card as="section">
      <CardHeader
        title="Users"
        description="Change a role or deactivate an account. You cannot change your own."
        icon={UserCog}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email"
            aria-label="Search users"
            className="focus-ring h-11 w-full rounded-2xl border border-slate-200 bg-white/80 pr-10 pl-10 text-sm text-slate-800 placeholder:text-slate-500"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="focus-ring absolute top-1/2 right-2.5 grid size-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-900/5"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="flex gap-1 rounded-full bg-white/70 p-1" role="group" aria-label="Filter by role">
          {ROLES.map(({ value, label }) => (
            <button
              key={value || "all"}
              type="button"
              aria-pressed={value === role}
              onClick={() => {
                setRole(value);
                setPage(1);
              }}
              className={`focus-ring rounded-full px-3.5 py-1.5 text-xs font-semibold transition
                ${value === role ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-900/5"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          {error.message}
        </p>
      ) : users.length === 0 ? (
        <EmptyState icon={UserCog} title="No users match that" description="Try a different search." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 border-collapse text-left">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th scope="col" className="px-3 pb-2 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-3 pb-2 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-3 pb-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 pb-2 font-medium">
                    Joined
                  </th>
                  <th scope="col" className="px-3 pb-2 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isMe = user.id === me?.id;
                  return (
                    <tr key={user.id} className="border-t border-white/80">
                      <td className="px-3 py-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {user.name}
                          {isMe ? <span className="ml-1.5 text-xs text-slate-500">(you)</span> : null}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                        {user.city ? <p className="text-xs text-slate-500">{user.city}</p> : null}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={user.role === "admin" ? "brand" : "neutral"}>{user.role}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={user.isActive ? "success" : "danger"}>
                          {user.isActive ? "active" : "inactive"}
                        </Badge>
                      </td>
                      <td className="tnum px-3 py-3 text-xs text-slate-500">
                        {formatShort(user.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isMe}
                            title={isMe ? "You cannot change your own role" : undefined}
                            onClick={() =>
                              setPending({
                                kind: "role",
                                user,
                                value: user.role === "admin" ? "user" : "admin",
                              })
                            }
                          >
                            {user.role === "admin" ? "Make user" : "Make admin"}
                          </Button>
                          <Button
                            variant={user.isActive ? "danger" : "primary"}
                            size="sm"
                            disabled={isMe}
                            title={isMe ? "You cannot deactivate yourself" : undefined}
                            onClick={() =>
                              setPending({ kind: "status", user, value: !user.isActive })
                            }
                          >
                            {user.isActive ? (
                              <ShieldOff className="size-4" aria-hidden="true" />
                            ) : (
                              <UserCheck className="size-4" aria-hidden="true" />
                            )}
                            {user.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} limit={LIMIT} total={total} onChange={setPage} />
        </>
      )}

      <ConfirmModal
        open={Boolean(pending)}
        loading={working}
        onClose={() => setPending(null)}
        onConfirm={onConfirm}
        variant={pending?.kind === "status" && pending?.value === false ? "danger" : "primary"}
        confirmLabel={pending?.kind === "role" ? "Change role" : pending?.value ? "Activate" : "Deactivate"}
        title={pending?.kind === "role" ? "Change this user's role?" : pending?.value ? "Activate this account?" : "Deactivate this account?"}
        description={
          pending?.kind === "role"
            ? `${pending?.user?.name} will become ${pending?.value}. Admins can see and change everything here.`
            : pending?.value
              ? `${pending?.user?.name} will be able to sign in again.`
              : `${pending?.user?.name} will be signed out immediately and blocked from signing in.`
        }
      />
    </Card>
  );
}
