import type { ReactNode } from "react";
import { FileText, Gauge, Plus } from "lucide-react";

export type IconType = typeof Gauge;
export type Tone = "good" | "warn" | "bad" | "info" | "neutral";

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function Stat({
  label,
  value,
  icon: Icon,
  tone = "teal",
  hint,
}: {
  label: string;
  value: string;
  icon: IconType;
  tone?: "teal" | "deep" | "ink" | "black";
  hint: string;
}) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon">
        <Icon size={19} />
      </div>
      <p>{label}</p>
      <strong title={value}>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

export function QuickAction({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: IconType;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="quick-action" onClick={onClick}>
      <span className="quick-icon">
        <Icon size={18} />
      </span>
      <span>
        <b>{title}</b>
        <small>{detail}</small>
      </span>
      <Plus size={16} className="quick-plus" />
    </button>
  );
}

export function PanelHead({
  title,
  subtitle,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  subtitle: string;
  onAdd?: () => void;
  addLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="panel-head">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="panel-actions">
        {children}
        {onAdd && (
          <button type="button" className="primary-btn small-btn" onClick={onAdd}>
            <Plus size={15} />
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyHint({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-hint">
      <span>
        <FileText size={20} />
      </span>
      <b>{title}</b>
      <p>{detail}</p>
    </div>
  );
}

export type TableRow = { key: string; cells: ReactNode[] };

export function DataTable({
  headers,
  rows,
  numeric = [],
  empty,
}: {
  headers: string[];
  rows: TableRow[];
  /** Column indexes that hold amounts and are right-aligned. */
  numeric?: number[];
  empty: { title: string; detail: string };
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={header + index} className={numeric.includes(index) ? "num" : undefined}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (
                <td key={index} className={numeric.includes(index) ? "num" : undefined}>
                  {cell === "" || cell == null ? "—" : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <EmptyHint title={empty.title} detail={empty.detail} />}
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  placeholder,
  list,
  hint,
  autoFocus,
  maxLength,
  autoComplete = "off",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  /** id of a <datalist> that offers matching suggestions while the user types. */
  list?: string;
  hint?: string;
  autoFocus?: boolean;
  maxLength?: number;
  autoComplete?: string;
}) {
  const numeric = type === "number";
  return (
    <label className="field">
      <span>
        {label}
        {required && <i> *</i>}
      </span>
      <input
        name={name}
        type={type}
        min={numeric ? 0 : undefined}
        step={numeric ? "any" : undefined}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        list={list}
        autoFocus={autoFocus}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  required = false,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  options: string[][];
  required?: boolean;
  /** Pass value + onChange to control the field; omit both to leave it uncontrolled. */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  const controlled = value !== undefined;
  return (
    <label className="field">
      <span>
        {label}
        {required && <i> *</i>}
      </span>
      <select
        name={name}
        required={required}
        {...(controlled ? { value, onChange: (event) => onChange?.(event.target.value) } : { defaultValue: "" })}
      >
        <option value="">{placeholder ?? `Select ${label.toLowerCase()}`}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
