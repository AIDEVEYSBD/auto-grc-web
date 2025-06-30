# AutoGRC - Cybersecurity Compliance Dashboard

A comprehensive cybersecurity compliance management platform built with Next.js, TypeScript, and Supabase.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/autogrc-dashboard)

## Features

- **Real-time Compliance Monitoring** - Track compliance across multiple frameworks (SOC 2, ISO 27001, NIST, PCI DSS)
- **Application Management** - Monitor security posture of all your applications
- **Integration Hub** - Connect with 50+ security tools and platforms
- **Capability Management** - Enable and configure security capabilities
- **Glassmorphism UI** - Modern, responsive design with dark/light mode support
- **Real-time Data** - Live updates from your Supabase database

## Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account with the required tables
- Environment variables configured

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/your-username/autogrc-dashboard.git
cd autogrc-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Start development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## Database Schema

The application expects the following Supabase tables:

- `applications` - Application inventory and scores
- `frameworks` - Compliance frameworks (SOC 2, ISO 27001, etc.)
- `controls` - Individual compliance controls
- `compliance_assessment` - Assessment results and scores
- `framework_mappings` - Control mappings between frameworks
- `integrations` - Connected security tools
- `capabilities` - Available security capabilities

## Architecture

\`\`\`mermaid
graph TB
    A[Next.js Frontend] --> B[Supabase Database]
    A --> C[SWR Data Fetching]
    C --> B
    A --> D[Recharts Visualization]
    A --> E[Tailwind CSS + Glassmorphism]
    F[Vercel Deployment] --> A
    G[GitHub Actions CI] --> F
