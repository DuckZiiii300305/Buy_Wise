import { PrismaClient, VerdictType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial canonical BuyWise products & analyses...');

  // Product 1: iPhone 15 Pro Max
  const p1 = await prisma.product.create({
    data: {
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      category: 'Smartphone',
      variant: '256GB Natural Titanium',
      rawInput: 'https://shopee.vn/apple-iphone-15-pro-max-256gb',
      normalizedJson: {
        specs: { storage: '256GB', color: 'Natural Titanium', screen: '6.7 inch Super Retina XDR', chip: 'A17 Pro' },
      },
      analyses: {
        create: {
          currentPrice: 29490000,
          verdict: VerdictType.WAIT,
          score: 78,
          confidence: 0.92,
          reasoning: {
            summary: 'Sản phẩm có chất lượng gia công vượt trội và camera xuất sắc, nhưng giá thị trường hiện tại đang ở mức đỉnh ngắn hạn và thế hệ mới chuẩn bị ra mắt trong tháng tới.',
            pros: ['Chip A17 Pro siêu mạnh mẽ', 'Khung vỏ Titanium siêu nhẹ', 'Camera zoom 5x sắc nét'],
            cons: ['Tản nhiệt hơi kém khi chơi game nặng lâu', 'Tốc độ sạc chưa ấn tượng'],
            hiddenConcerns: ['Một số lô hàng đợt đầu bị hiện tượng dán kính lệch viền nhỏ', 'Chi phí sửa chữa màn hình cao'],
            priceAssessment: 'HIGH',
            marketRange: { min: 27900000, median: 28500000, max: 30490000 },
          },
          evidences: {
            create: [
              {
                sourceUrl: 'https://tinhte.vn/thread/danh-gia-iphone-15-pro-max.3720192',
                title: 'Đánh giá chi tiết iPhone 15 Pro Max sau 6 tháng',
                sourceType: 'Forum / Tech Review',
                snippet: 'Hiệu năng A17 Pro cân tốt mọi tác vụ, khung Titanium cầm nắm dễ chịu hơn hẳn 14 Pro Max.',
                relevance: 0.95,
              },
              {
                sourceUrl: 'https://cellphones.com.vn/iphone-15-pro-max-256gb.html',
                title: 'Bảng giá iPhone 15 Pro Max chính hãng VN/A',
                sourceType: 'Retailer Price',
                snippet: 'Giá niêm yết 29.490.000đ kèm gói bảo hành rơi vỡ 12 tháng.',
                relevance: 0.98,
              },
            ],
          },
          reviews: {
            create: [
              { aspect: 'Hiệu năng & Chipset', sentiment: 'POSITIVE', confidence: 0.95 },
              { aspect: 'Thời lượng Pin', sentiment: 'POSITIVE', confidence: 0.88 },
              { aspect: 'Nhiệt độ & Tản nhiệt', sentiment: 'NEGATIVE', confidence: 0.82 },
              { aspect: 'Mức giá & Khấu hao', sentiment: 'NEGATIVE', confidence: 0.90 },
            ],
          },
          alternatives: {
            create: [
              { productName: 'Samsung Galaxy S24 Ultra 256GB', price: 26990000, score: 85, reason: 'Màn hình phẳng chống lóa tốt hơn, đi kèm bút S-Pen và giá mềm hơn 2.5 triệu' },
              { productName: 'iPhone 15 Pro 128GB', price: 24500000, score: 81, reason: 'Nhỏ gọn hơn, cùng chip A17 Pro với chi phí tiết kiệm đáng kể' },
            ],
          },
        },
      },
    },
  });

  // Product 2: Sony WH-1000XM5
  const p2 = await prisma.product.create({
    data: {
      brand: 'Sony',
      model: 'WH-1000XM5',
      category: 'Headphones',
      variant: 'Black - Wireless Noise Canceling',
      rawInput: 'Sony WH-1000XM5 Wireless Headphones',
      normalizedJson: {
        specs: { driver: '30mm', battery: '30 hours', anc: 'Auto NC Optimizer', weight: '250g' },
      },
      analyses: {
        create: {
          currentPrice: 7490000,
          verdict: VerdictType.BUY,
          score: 91,
          confidence: 0.96,
          reasoning: {
            summary: 'Tai nghe chống ồn chủ động tốt nhất phân khúc giá dưới 8 triệu. Giá hiện tại đang được giảm 15% so với giá niêm yết.',
            pros: ['Chống ồn ANC đỉnh cao', 'Trọng lượng nhẹ đeo thoải mái', 'Micro đàm thoại lọc gió ấn tượng'],
            cons: ['Không thể gập gọn như XM4', 'Không kháng nước chuẩn IPX'],
            hiddenConcerns: ['Đệm tai giả da có thể bị bong tróc sau 2 năm nếu môi trường nhiều mồ hôi'],
            priceAssessment: 'GOOD',
            marketRange: { min: 7200000, median: 7990000, max: 8490000 },
          },
          evidences: {
            create: [
              {
                sourceUrl: 'https://rtings.com/headphones/reviews/sony/wh-1000xm5',
                title: 'Sony WH-1000XM5 Headphone Review & ANC Lab Tests',
                sourceType: 'Lab Benchmark',
                snippet: 'Top class noise isolation performance across low and mid frequencies.',
                relevance: 0.99,
              },
            ],
          },
          reviews: {
            create: [
              { aspect: 'Khả năng Chống ồn (ANC)', sentiment: 'POSITIVE', confidence: 0.98 },
              { aspect: 'Chất lượng Âm thanh', sentiment: 'POSITIVE', confidence: 0.90 },
              { aspect: 'Độ linh hoạt khi di chuyển', sentiment: 'NEUTRAL', confidence: 0.85 },
            ],
          },
          alternatives: {
            create: [
              { productName: 'Bose QuietComfort Ultra Headphones', price: 9290000, score: 88, reason: 'Chống ồn tương đương nhưng thiết kế gập gọn linh hoạt hơn' },
              { productName: 'Sony WH-1000XM4', price: 5490000, score: 87, reason: 'Tiết kiệm 2 triệu, gập gọn tốt nhưng micro đàm thoại kém hơn XM5' },
            ],
          },
        },
      },
    },
  });

  console.log('Seeding finished successfully!', { p1: p1.id, p2: p2.id });
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
