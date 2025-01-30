import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ReceiptItem {
  description: string
  price: number
  category: string
}

interface Receipt {
  id: string
  date: string
  items: ReceiptItem[]
  tax: number
  total: number
}

interface Props {
  receipts: Receipt[]
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    FOOD: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800',
    BEVERAGE: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800',
    GROCERY: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800',
    HOUSEHOLD: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800',
    ELECTRONICS: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800',
    PERSONAL_CARE: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-pink-100 text-pink-800',
    CLOTHING: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800',
    OTHER: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800'
  };
  return colors[category] || colors.OTHER;
}

export function ReceiptsTable({ receipts }: Props) {
  // Sort receipts by date, newest first
  const sortedReceipts = [...receipts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="overflow-x-auto">
      <Table className="font-mono text-sm">
        <TableHeader>
          <TableRow className="border-b-2 border-receipt-border">
            <TableHead className="text-receipt-text">Date</TableHead>
            <TableHead className="text-receipt-text">Item</TableHead>
            <TableHead className="text-receipt-text">Category</TableHead>
            <TableHead className="text-receipt-text text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReceipts.map((receipt, receiptIndex) => (
            <>
              {receipt.items.map((item, itemIndex) => (
                <TableRow 
                  key={`${receipt.id}-${itemIndex}`} 
                  className="border-b border-receipt-border/50"
                >
                  <TableCell>{itemIndex === 0 ? receipt.date : ''}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <span className={getCategoryColor(item.category)}>
                      {item.category.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {/* Tax and Total rows */}
              <TableRow className="border-b border-receipt-border/50 bg-gray-50">
                <TableCell></TableCell>
                <TableCell className="font-semibold">Tax</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">${receipt.tax.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="border-b-2 border-receipt-border bg-gray-50">
                <TableCell></TableCell>
                <TableCell className="font-bold">Total</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-bold">${receipt.total.toFixed(2)}</TableCell>
              </TableRow>
              {/* Add spacing between receipts if not the last receipt */}
              {receiptIndex < sortedReceipts.length - 1 && (
                <TableRow className="h-6">
                  <TableCell colSpan={4}></TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 