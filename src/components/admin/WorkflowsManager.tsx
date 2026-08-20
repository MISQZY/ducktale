/* eslint-disable */
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { WorkflowTarget } from ".prisma/site-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPickerField } from "@/components/admin/ColorPickerField";
import { Checkbox } from "@/components/ui/checkbox";
import { LocalizedNameInput } from "@/components/common/LocalizedNameInput";
import type { LocalizedName } from "@/lib/i18n-name";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkflowStatusBadge } from "@/components/common/WorkflowStatusBadge";
import { createWorkflowStatus, deleteWorkflowStatus, updateWorkflowStatus, addWorkflowTransition, removeWorkflowTransition } from "@/lib/actions/workflows";
import { Trash2, Plus, ArrowRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export function WorkflowsManager({ lang, initialStatuses }: { lang: string, initialStatuses: any[] }) {
  const t = useTranslations("Admin.workflows");
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<WorkflowTarget>("TICKET");
  const [transitionTargets, setTransitionTargets] = useState<Record<string, string>>({});
  const router = useRouter();

  const statuses = initialStatuses.filter(s => s.target === target);

  const [newName, setNewName] = useState<LocalizedName>({ ru: "", en: "" });
  const [activeLocale, setActiveLocale] = useState<"ru" | "en">("en");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newIsInitial, setNewIsInitial] = useState(false);
  const [newIsClosed, setNewIsClosed] = useState(false);

  const handleCreate = () => {
    startTransition(async () => {
      await createWorkflowStatus(lang, target, {
        name: newName,
        color: newColor,
        isInitial: newIsInitial,
        isClosed: newIsClosed,
      });
      setNewName({ ru: "", en: "" });
      setNewIsInitial(false);
      setNewIsClosed(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteWorkflowStatus(lang, id);
      router.refresh();
    });
  };

  return (
    <div className="liquid-card h-[75vh] w-full rounded-2xl border border-primary/20 bg-card/50 overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" id="workflows-layout">
        {/* Navigation Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} className="bg-card/50">
          <div className="flex flex-col gap-2 p-4">
            {["TICKET", "APPLICATION", "REPORT", "THREAD"].map(key => (
              <Button 
                key={key} 
                variant={target === key ? "default" : "ghost"} 
                className="justify-start w-full" 
                onClick={() => setTarget(key as WorkflowTarget)}
              >
                {t(`tabs.${key}`)}
              </Button>
            ))}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Statuses Editor */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold tracking-tight">{t("statusesTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("statusesDesc", { target })}</p>
              </div>
              
              <div className="space-y-4">
                {statuses.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                    <div className="flex items-center gap-3">
                      <WorkflowStatusBadge color={s.color} label={s.name[lang] || s.name.en || s.name.ru || t("unknown")} />
                      <div className="text-xs font-medium">
                        {s.isInitial && <span className="text-green-500 mr-2">{t("initialBadge")}</span>}
                        {s.isClosed && <span className="text-red-500">{t("closedBadge")}</span>}
                      </div>
                    </div>
                    <Button variant="outline" size="icon" className="bg-card/60 group" disabled={isPending || s.isInitial} onClick={() => handleDelete(s.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t mt-6">
                <LocalizedNameInput
                  id="workflow-status-name"
                  label={t("addStatus")}
                  ruName="nameRu"
                  enName="nameEn"
                  value={newName}
                  onChange={setNewName}
                  active={activeLocale}
                  onActiveChange={setActiveLocale}
                />
                <div className="space-y-4 mt-4">
                  <ColorPickerField color={newColor} setColor={setNewColor} label={t("colorLabel")} />
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="is-initial" checked={newIsInitial} onCheckedChange={(c: boolean) => setNewIsInitial(c)} />
                      <label htmlFor="is-initial" className="text-sm font-medium">{t("isInitial")}</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="is-closed" checked={newIsClosed} onCheckedChange={(c: boolean) => setNewIsClosed(c)} />
                      <label htmlFor="is-closed" className="text-sm font-medium">{t("isClosed")}</label>
                    </div>
                  </div>
                  
                  <Button onClick={handleCreate} disabled={isPending || !newName.en || !newName.ru} className="w-full mt-4">
                    {t("addButton")}
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Transitions Editor */}
        <ResizablePanel defaultSize={40} minSize={25} className="bg-muted/30">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold tracking-tight">{t("transitionsTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("transitionsDesc")}</p>
              </div>

              <div className="space-y-6 mt-4">
                {statuses.map(s => (
                  <div key={s.id} className="space-y-3 p-4 rounded-lg border bg-card">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <WorkflowStatusBadge color={s.color} label={s.name[lang] || s.name.en || s.name.ru || t("unknown")} /> 
                      <span className="text-muted-foreground">{t("canTransitionTo")}</span>
                    </div>
                    
                    {s.outgoingTransitions.length > 0 ? (
                      <div className="space-y-2">
                        {s.outgoingTransitions.map((tItem: any) => {
                          const toStatus = statuses.find(x => x.id === tItem.toId);
                          return (
                            <div key={tItem.id} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                              {toStatus ? <WorkflowStatusBadge color={toStatus.color} label={toStatus.name[lang] || toStatus.name.en || t("unknown")} /> : <span className="text-muted-foreground">{t("unknown")}</span>}
                              <Button variant="outline" size="icon" className="w-7 h-7 ml-auto bg-card/60 group" disabled={isPending} onClick={() => {
                                startTransition(async () => {
                                  await removeWorkflowTransition(lang, tItem.id);
                                  router.refresh();
                                });
                              }}>
                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border border-dashed text-center">
                        {t("noTransitions")}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-2 border-t mt-2">
                      <Select value={transitionTargets[s.id] || ""} onValueChange={(val) => setTransitionTargets(prev => ({...prev, [s.id]: val}))}>
                        <SelectTrigger className="flex-1 h-8">
                          <SelectValue placeholder={t("selectTarget")} />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.filter(x => x.id !== s.id && !s.outgoingTransitions.find((ot: any) => ot.toId === x.id)).map(x => (
                            <SelectItem key={x.id} value={x.id}>{x.name[lang] || x.name.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="secondary" className="h-8" disabled={isPending || !transitionTargets[s.id]} onClick={() => {
                        const targetId = transitionTargets[s.id];
                        if (!targetId) return;
                        startTransition(async () => {
                          await addWorkflowTransition(lang, s.id, targetId);
                          setTransitionTargets(prev => ({...prev, [s.id]: ""}));
                          router.refresh();
                        });
                      }}>
                        {t("addTransitionBtn")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
