# PowerLens - Power BI License Calculator

A comprehensive web-based calculator that helps organizations determine the most appropriate Microsoft Power BI and Fabric licensing strategy based on their specific requirements and usage patterns.

![PowerLens Logo](DataSarva.jpg)

**Developed by DataSarva**

## 🎯 Overview

PowerLens is an intelligent licensing calculator designed to simplify the complex landscape of Microsoft Power BI and Fabric licensing. It guides users through a multi-step wizard to assess their organization's needs and provides tailored recommendations with detailed cost estimates.

## ✨ Features

### 🧙‍♂️ Intelligent Wizard Interface
- **4-Step Guided Process**: Systematic collection of requirements
- **Interactive UI**: Modern, responsive design with smooth transitions
- **Smart Logic**: Dynamic questions based on previous answers

### 📊 Comprehensive Analysis
- **User Scale Assessment**: Separate analysis for viewers vs. publishers
- **Embedding Scenarios**: Support for internal/external embedding requirements
- **Data Model Sizing**: Recommendations based on expected data volumes
- **Feature Requirements**: Analysis of premium feature needs

### 💰 Detailed Cost Estimation
- **Real-time Calculations**: Instant cost estimates based on selections
- **Multiple Licensing Options**: Pro, PPU, and Fabric Capacity comparisons
- **Reserved Pricing**: Includes estimated savings with reservation pricing
- **Cost Breakdown**: Detailed explanation of licensing costs

### 📚 Educational Resources
- **Built-in Documentation**: Comprehensive Microsoft Fabric licensing guide
- **Interactive Accordion**: Expandable sections for detailed information
- **Reference Links**: Direct links to official Microsoft documentation
- **Pricing Tables**: Current SKU pricing information

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/powerlens.git
   ```

2. Navigate to the project directory:
   ```bash
   cd powerlens
   ```

3. Open `index.html` in your web browser or serve it using a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with npx)
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

4. Access the application at `http://localhost:8000`

## 🎮 Usage Guide

### Step 1: Basic Usage & Scale
- **Viewers**: Enter the number of people who will primarily view reports
- **Publishers**: Enter the number of people who will create and publish reports

### Step 2: Embedding Needs
- Specify if you need to embed Power BI reports in other applications
- Choose target audience (internal, external, or mixed)
- Indicate if internal users need direct portal access

### Step 3: Data & Feature Requirements
- Select expected maximum data model size
- Choose required premium features:
  - AI-powered insights (Copilot)
  - High-frequency data refreshes
  - External tool connectivity (XMLA)
  - Deployment pipelines
  - On-premises hosting
  - Unlimited sharing capabilities

### Step 4: Cost Considerations
- Indicate if users have existing Microsoft 365 E5 licenses
- Review final recommendations and cost estimates

## 📋 Licensing Options Covered

### Power BI Pro ($14/user/month)
- Basic sharing and collaboration
- Standard data model limits (1GB)
- Essential business intelligence features

### Power BI Premium Per User (PPU) ($24/user/month)
- Advanced premium features
- Larger data models (up to 100GB)
- Enhanced refresh capabilities
- Deployment pipelines

### Microsoft Fabric Capacity (F-SKUs)
- Enterprise-scale analytics platform
- Multiple SKU options (F2 to F2048)
- Unlimited user consumption (with F64+)
- Advanced AI and analytics capabilities

## 🏗️ Technical Architecture

### Frontend Stack
- **HTML5**: Semantic markup with modern standards
- **CSS3**: Responsive design with Flexbox layout
- **Vanilla JavaScript**: No external dependencies
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Key Components
```
powerlens/
├── index.html          # Main application structure
├── style.css           # Responsive styling and themes
├── script.js           # Application logic and calculations
├── DataSarva.jpg       # Company logo
└── README.md           # Documentation
```

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 💡 Calculation Logic

### Cost Estimation Algorithm
1. **User Count Analysis**: Separate calculation for viewers and publishers
2. **Feature Requirement Mapping**: Match selected features to licensing tiers
3. **Data Model Sizing**: Determine minimum SKU based on data requirements
4. **Embedding Logic**: Special handling for embedded scenarios
5. **Cost Optimization**: Compare different licensing approaches
6. **E5 Integration**: Account for existing Microsoft 365 E5 investments

### Pricing Data
- Based on Central US region pricing
- Includes estimated 41% savings with reservation pricing
- Updated pricing tables for all Fabric SKUs
- Consideration of Microsoft 365 E5 add-on pricing

## 🎨 Design Philosophy

### User Experience
- **Guided Journey**: Step-by-step approach reduces complexity
- **Progressive Disclosure**: Show relevant options based on selections
- **Immediate Feedback**: Real-time validation and guidance
- **Mobile-First**: Responsive design for all devices

### Visual Design
- **Clean Interface**: Minimal, professional aesthetic
- **Consistent Branding**: Microsoft theme colors and typography
- **Accessible Design**: High contrast and keyboard navigation
- **Loading States**: Smooth transitions and animations

## 🔧 Customization

### Pricing Updates
Update pricing constants in `script.js`:
```javascript
const PRO_COST = 14;           // Power BI Pro monthly cost
const PPU_COST = 24;           // PPU monthly cost
const F64_RESERVED_COST = 5002.67; // F64 reservation cost
```

### Feature Additions
Add new premium features in the HTML and update the mapping in JavaScript:
```javascript
const getFeatureName = (key) => {
    const names = {
        'newFeature': 'New Feature Description',
        // ... existing features
    };
}
```

### Branding
- Replace `DataSarva.jpg` with your organization's logo
- Update the logo text in `index.html`
- Modify colors in `style.css` to match your brand

## 📊 Analytics Integration

The application is ready for analytics integration. Common integration points:

- **Step Completion Tracking**: Monitor wizard progression
- **Feature Selection Analysis**: Track most commonly selected features
- **Cost Range Analytics**: Understand typical cost estimates
- **User Journey Mapping**: Analyze user paths through the wizard

## 🔒 Security Considerations

- **Client-Side Only**: No sensitive data is transmitted to servers
- **No External Dependencies**: Reduces attack surface
- **Input Validation**: Proper sanitization of user inputs
- **HTTPS Ready**: Works seamlessly with SSL/TLS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Maintain backward compatibility
- Update pricing data regularly
- Test across different browsers
- Follow accessibility best practices
- Document any new features or changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Contact DataSarva team
- Check Microsoft's official documentation for licensing updates

## 🔗 Resources

### Official Microsoft Documentation
- [Power BI Pricing](https://www.microsoft.com/en-us/power-platform/products/power-bi/pricing)
- [Power BI License Types](https://learn.microsoft.com/en-us/power-bi/consumer/end-user-license)
- [Microsoft Fabric Licenses](https://learn.microsoft.com/en-us/fabric/enterprise/licenses)
- [Microsoft Fabric Pricing](https://azure.microsoft.com/en-us/pricing/details/microsoft-fabric/)

### Additional Tools
- [Microsoft Fabric Trial](https://fabric.microsoft.com/)
- [Power BI Community](https://community.powerbi.com/)
- [Microsoft Learn - Power BI](https://learn.microsoft.com/en-us/power-bi/)

## 📈 Roadmap

### Planned Features
- [ ] Multi-language support
- [ ] Currency conversion
- [ ] Regional pricing variations
- [ ] Export recommendations to PDF
- [ ] Integration with Microsoft Graph APIs
- [ ] Advanced cost modeling scenarios
- [ ] Mobile app companion

### Recent Updates
- ✅ Updated F-SKU pricing table
- ✅ Added Microsoft 365 E5 integration
- ✅ Enhanced embedding scenario analysis
- ✅ Improved mobile responsiveness

---

**PowerLens** - Empowering organizations to make informed Microsoft licensing decisions.

*Built with ❤️ by DataSarva*
