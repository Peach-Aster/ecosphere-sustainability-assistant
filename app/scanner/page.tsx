'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { getAllProducts, searchProducts, Product } from '@/lib/services/productService';
import { Search, Leaf, Award, Recycle, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 60) return 'text-lime-600 bg-lime-50 border-lime-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (score >= 20) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
};

export default function ScannerPage() {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getAllProducts(supabase);
      setAllProducts(data);
      setProducts(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setProducts(allProducts);
      return;
    }
    setSearching(true);
    try {
      const results = await searchProducts(supabase, query);
      setProducts(results);
    } catch (error: any) {
      toast.error(error.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setProducts(allProducts);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Eco-Scanner</h1>
        <p className="text-gray-600 mt-1">Search products to see their sustainability score and greener alternatives</p>
      </div>

      <form onSubmit={handleSearch} className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a product (e.g. bottle, beef, t-shirt)..."
            className="pl-10 pr-10 h-12"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button type="submit" className="h-12 px-6 bg-green-600 hover:bg-green-700">
          Scan
        </Button>
      </form>

      {loading || searching ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{searching ? 'Scanning products...' : 'Loading products...'}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products found. Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelected(product)}
            >
              <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <CardDescription className="mt-1">{product.category}</CardDescription>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg border ${getScoreColor(product.sustainability_score)}`}>
                        <div className="text-2xl font-bold leading-none">{product.sustainability_score}</div>
                        <div className="text-xs mt-0.5">{getScoreLabel(product.sustainability_score)}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {Number(product.carbon_footprint).toFixed(3)} kg CO₂
                      </span>
                      {product.eco_certifications && product.eco_certifications.length > 0 && (
                        <div className="flex gap-1">
                          {product.eco_certifications.slice(0, 2).map((cert) => (
                            <Badge key={cert} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <Card
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selected.name}</CardTitle>
                  <CardDescription className="mt-1">{selected.category}</CardDescription>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className={`px-6 py-4 rounded-xl border-2 ${getScoreColor(selected.sustainability_score)}`}>
                  <div className="text-5xl font-bold text-center">{selected.sustainability_score}</div>
                  <div className="text-sm text-center mt-1">Sustainability Score · {getScoreLabel(selected.sustainability_score)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-xs text-gray-500">Carbon Footprint</div>
                  <div className="text-lg font-bold text-gray-900">
                    {Number(selected.carbon_footprint).toFixed(3)} kg CO₂
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-xs text-gray-500">Certifications</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selected.eco_certifications && selected.eco_certifications.length > 0
                      ? selected.eco_certifications.join(', ')
                      : 'None'}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">{selected.description}</p>

              {selected.alternatives && selected.alternatives.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Recycle className="w-4 h-4 mr-1 text-green-600" />
                    Greener Alternatives
                  </h4>
                  <div className="space-y-2">
                    {selected.alternatives.map((alt, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{alt.name}</div>
                          <div className="text-xs text-green-700">{alt.savings}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`text-sm font-bold ${getScoreColor(alt.score).split(' ')[0]}`}>
                            {alt.score}
                          </div>
                          <ArrowRight className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
