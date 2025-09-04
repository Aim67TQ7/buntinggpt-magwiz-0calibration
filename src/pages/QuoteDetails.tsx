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
      
      // Fetch specific quote
      const { data: quoteData, error: quoteError } = await supabase
        .from('BMR_quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (quoteError) throw quoteError;

      // Fetch quote items for this quote
      const { data: quoteItemsData, error: quoteItemsError } = await supabase
        .from('BMR_quote_items')
        .select('*')
        .eq('quote_id', id);

      if (quoteItemsError) throw quoteItemsError;

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('BMR_products')
        .select('*');

      if (productsError) throw productsError;

      // Fetch BOM items for this product
      const { data: bomData, error: bomError } = await supabase
        .from('BMR_parts')
        .select('*')
        .eq('bom', quoteData.product_id);

      if (bomError) throw bomError;

      setQuote(quoteData);
      setQuoteItems(quoteItemsData || []);
      setProducts(productsData || []);
      setBomItems(bomData || []);
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