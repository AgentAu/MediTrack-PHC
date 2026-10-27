import { Link } from "react-router-dom";

/**
 * @param {{ items: Array<{ label: string, to?: string }> }} props
 * The last item is the current page (no link).
 */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="breadcrumb" className="mb-3">
      <ol className="breadcrumb small">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className={`breadcrumb-item${isLast ? " active" : ""}`} aria-current={isLast ? "page" : undefined}>
              {isLast || !item.to ? item.label : <Link to={item.to} className="text-decoration-none">{item.label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
