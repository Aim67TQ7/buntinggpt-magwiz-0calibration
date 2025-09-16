import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Quote {
  id: number;
  quote_number: string;
  product_id: number;
  date_generated: number;
  verified: string;
  date_verified: string;
}

interface QuoteItem {
  "# item_id": number;
  quote_id: number;
  amount: number;
  weight: number | null;
  cost: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

interface BOMItem {
  id: number;
  bom: number;
  material: number;
  amount: number;
  name: string;
}

const QuoteDetails = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quoteId) {
      fetchQuoteDetails(parseInt(quoteId));
    }
  }, [quoteId]);

  const fetchQuoteDetails = async (id: number) => {
    try {
      setLoading(true);
      
      // Using mock data since BMR tables don't exist yet
      const mockQuote: Quote = {
        id: id,
        quote_number: `Q2024-${id.toString().padStart(3, '0')}`,
        product_id: 1,
        date_generated: Math.floor(Date.now() / 1000),
        verified: "true",
        date_verified: new Date().toISOString()
      };

      const mockQuoteItems: QuoteItem[] = [
        {
          "# item_id": 1,
          quote_id: id,
          amount: 2,
          weight: 150.5,
          cost: 2500,
          name: "Magnetic Separator Core"
        },
        {
          "# item_id": 2,
          quote_id: id,
          amount: 1,
          weight: 75.2,
          cost: 1200,
          name: "Control Unit"
        },
        {
          "# item_id": 3,
          quote_id: id,
          amount: 4,
          weight: 25.0,
          cost: 300,
          name: "Mounting Brackets"
        }
      ];

      const mockProducts: Product[] = [
        { id: 1, name: "Heavy Duty Magnetic Separator" },
        { id: 2, name: "Compact Magnetic Separator" }
      ];

      const mockBomItems: BOMItem[] = [
        {
          id: 1,
          bom: 1,
          material: 101,
          amount: 4,
          name: "Steel Core Component"
        },
        {
          id: 2,
          bom: 1,
          material: 102,
          amount: 2,
          name: "Copper Winding"
        },
        {
          id: 3,
          bom: 1,
          material: 103,
          amount: 8,
          name: "Permanent Magnets"
        },
        {
          id: 4,
          bom: 1,
          material: 104,
          amount: 1,
          name: "Control Circuit Board"
        }
      ];

      setQuote(mockQuote);
      setQuoteItems(mockQuoteItems);
      setProducts(mockProducts);
      setBomItems(mockBomItems);
    } catch (error) {
      console.error('Error fetching quote details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product?.name || `Product ${productId}`;
  };

  const getQuoteTotal = () => {
    return quoteItems.reduce((total, item) => total + (item.cost * item.amount), 0);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading quote details...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Quote not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Quote Details - {quote.quote_number || `Quote ${quote.id}`}</h1>
      </div>

      {/* Quote Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="font-medium text-muted-foreground">Product:</span>
              <p className="text-lg">{getProductName(quote.product_id)}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Date Generated:</span>
              <p className="text-lg">{formatDate(quote.date_generated)}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Status:</span>
              <div className="mt-1">
                <Badge variant={quote.verified === "true" ? "default" : "secondary"}>
                  {quote.verified === "true" ? "Verified" : "Pending"}
                </Badge>
              </div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Total Cost:</span>
              <p className="text-lg font-bold">${getQuoteTotal().toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quote Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Cost per Unit</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Weight (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quoteItems.map((item) => (
                <TableRow key={item["# item_id"]}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell>${item.cost.toLocaleString()}</TableCell>
                  <TableCell>${(item.cost * item.amount).toLocaleString()}</TableCell>
                  <TableCell>{item.weight || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {quoteItems.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No quote items found
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOM Components Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bill of Materials - Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component Name</TableHead>
                <TableHead>Amount Required</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>BOM ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bomItems.map((item) => {
                const material = products.find(p => p.id === item.material);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell>{material?.name || `Material ${item.material}`}</TableCell>
                    <TableCell>{item.bom}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {bomItems.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No BOM components found for this product
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuoteDetails;