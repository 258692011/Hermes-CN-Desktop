import { useMcpServers } from "@/hooks/use-mcp-servers";
import { SectionShell } from "./section-shell";
import s from "./mcp.module.css";

export function McpRoute() {
  const { data, isLoading, isError, error } = useMcpServers();

  const summary = data?.summary;
  const sub = isError
    ? "未接入"
    : summary
      ? `${summary.enabled} / ${summary.total} 启用`
      : isLoading
        ? "加载中…"
        : "—";

  return (
    <SectionShell title="MCP 服务" sub={sub}>
      <p className={s.desc}>
        Model Context Protocol 服务由 Hermes 网关托管。这里展示 dashboard 当前感知到的服务实例与启用状态。
      </p>

      {isError ? (
        <div className={s.errorState}>
          <strong>无法读取 MCP 状态。</strong>
          <p>
            {error instanceof Error ? error.message : "未知错误"}。常见原因是 dashboard 启动早于 gateway，重启 dashboard 即可。
          </p>
        </div>
      ) : isLoading || !data ? (
        <div className={s.emptyState}>加载中…</div>
      ) : data.servers.length === 0 ? (
        <div className={s.emptyState}>
          没有任何 MCP 服务。可以在 <code>~/.hermes/config.yaml</code> 的 <code>mcp_servers</code>
          字段添加，或者通过{" "}
          <code>hermes config set mcp_servers.&lt;name&gt;.command "..."</code> 添加。
        </div>
      ) : (
        <div className={s.list}>
          {data.servers.map((srv) => (
            <div key={srv.name} className={s.row}>
              <div className={s.rowMeta}>
                <span className={s.rowName}>{srv.name}</span>
                <span
                  className={s.rowState}
                  data-tone={srv.enabled ? "ok" : "off"}
                >
                  {srv.enabled ? "已启用" : "已禁用"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className={s.footnote}>
        启用/禁用 MCP 服务暂未在 UI 内提供 —— 修改 <code>~/.hermes/config.yaml</code> 后重启 dashboard 生效。
      </p>
    </SectionShell>
  );
}
