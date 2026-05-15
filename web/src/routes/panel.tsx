import { useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { chatRuntimeBySessionAtom } from "@/stores/chat";
import { activeSessionIdAtom } from "@/stores/ui";
import { useSessions } from "@/hooks/use-sessions";
import { isSessionRunning } from "@/lib/session-activity";
import {
  readSessionTitleOverrides,
  subscribeSessionUiStateChanges,
} from "@/lib/session-ui-state";
import { TopBar } from "@/components/top-bar/top-bar";
import { HealthGrid } from "@/components/panel/health-grid";
import { PanelComposer } from "@/components/panel/panel-composer";
import { PanelHero } from "@/components/panel/panel-hero";
import { PanelTopChips } from "@/components/panel/panel-top-chips";
import { QuickStart } from "@/components/panel/quick-start";
import { RecentTable } from "@/components/panel/recent-table";
import { TaskCard } from "@/components/panel/task-card";
import type { SessionSummary } from "@hermes/protocol";
import s from "./panel.module.css";

const TODAY_START_SEC = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime() / 1000;
};

export function PanelRoute() {
  const [, setActiveId] = useAtom(activeSessionIdAtom);
  const runtimeBySession = useAtomValue(chatRuntimeBySessionAtom);
  const { data, isLoading } = useSessions();
  const navigate = useNavigate();
  const [sessionTitleOverrides, setSessionTitleOverrides] = useState(readSessionTitleOverrides);

  useEffect(() => {
    return subscribeSessionUiStateChanges(() => {
      setSessionTitleOverrides(readSessionTitleOverrides());
    });
  }, []);

  const sessions = useMemo(
    () => (data?.sessions ?? []).flatMap((session) => {
      const title = sessionTitleOverrides[session.id];
      return title ? [{ ...session, title }] : [session];
    }),
    [data?.sessions, sessionTitleOverrides],
  );

  const { active, recent } = useMemo(() => {
    const active = sessions.filter((session) => isSessionRunning(session, runtimeBySession));
    const recent = sessions.filter((session) => !isSessionRunning(session, runtimeBySession));
    return { active, recent };
  }, [runtimeBySession, sessions]);

  const todayStats = useMemo(() => {
    const start = TODAY_START_SEC();
    let completed = 0;
    let needsAttention = 0;
    for (const sess of sessions) {
      if (sess.ended_at != null && sess.ended_at >= start) {
        if (sess.end_reason === "error" || sess.end_reason === "interrupted") {
          needsAttention += 1;
        } else {
          completed += 1;
        }
      }
    }
    return { completed, needsAttention };
  }, [sessions]);

  const goSession = (sess: SessionSummary) => {
    setActiveId(sess.id);
    navigate(`/tasks/${sess.id}`);
  };

  const subtitle = `${active.length} 个运行中 · 今日 ${todayStats.completed} 个完成 · ${todayStats.needsAttention} 个需要关注`;

  return (
    <div className={s.page}>
      <TopBar title="任务面板" sub={subtitle} right={<PanelTopChips />} />
      <div className={s.content}>
        <div className={s.hero}>
          <PanelHero activeCount={active.length} />
        </div>

        <div className={s.composerWrap}>
          <PanelComposer />
        </div>

        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>健康检查</h2>
          </div>
          <HealthGrid />
        </section>

        {isLoading && <div className={s.loading}>加载中…</div>}

        {active.length > 0 && (
          <section className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>正在运行</h2>
              <span className={s.sectionMeta}>{active.length} 个任务 · 自动刷新</span>
            </div>
            <div className={s.taskGrid}>
              {active.map((sess) => (
                <TaskCard key={sess.id} session={sess} onClick={() => goSession(sess)} />
              ))}
            </div>
          </section>
        )}

        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>最近会话</h2>
            <span className={s.sectionMeta}>共 {recent.length} 个</span>
          </div>
          <RecentTable sessions={recent} onOpen={goSession} />
        </section>

        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>快速起手</h2>
            <span className={s.sectionMeta}>点击预填到 Composer</span>
          </div>
          <QuickStart />
        </section>
      </div>
    </div>
  );
}
