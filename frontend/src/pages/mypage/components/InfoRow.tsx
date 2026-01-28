interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center text-16">
      <span className="text-neutral-text-tertiary font-medium">{label}</span>
      <span className="text-neutral-text-primary font-medium">{value}</span>
    </div>
  );
}

export default InfoRow;
