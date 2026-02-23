interface TransactionItemProps {
  icon: string;
  name: string;
  time: string;
  amount: number;
  type: 'expense' | 'income';
  userName?: string;
}

export function TransactionItem({
  icon,
  name,
  time,
  amount,
  type,
  userName,
}: TransactionItemProps) {
  const bgColor = type === 'expense' ? 'bg-amber-50' : 'bg-green-50';
  const amountColor = type === 'expense' ? 'text-red-600' : 'text-green-600';

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-2xl border border-dashed border-muted ${bgColor} shadow-sm`}
    >
      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          {userName && <span className="font-medium">{userName} • </span>}
          {time}
        </p>
      </div>
      <p className={`font-bold text-sm ${amountColor} whitespace-nowrap`}>
        {type === 'expense' ? '-' : '+'}
        {amount.toLocaleString()} ₫
      </p>
    </div>
  );
}
