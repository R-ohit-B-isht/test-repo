import './App.css'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { PieChart, Pie, Cell } from 'recharts'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  Megaphone, 
  Settings, 
  HelpCircle, 
  LogOut,
  TrendingUp
} from 'lucide-react'

function App() {
  const barChartData = [
    { name: 'Jan', connections: 175, followers: 200, invites: 120 },
    { name: 'Feb', connections: 250, followers: 300, invites: 180 },
    { name: 'Mar', connections: 300, followers: 400, invites: 240 },
    { name: 'Apr', connections: 400, followers: 500, invites: 280 },
    { name: 'May', connections: 500, followers: 600, invites: 320 },
  ]

  const donutChartData = [
    { name: 'Invitations sent', value: 286, color: '#1F1F1F' },
    { name: 'Pending invitations', value: 12, color: '#C2ECC1' },
    { name: 'Profile views', value: 2891, color: '#C5C7F6' },
  ]
  const totalDonutValue = donutChartData.reduce((sum, item) => sum + item.value, 0)


  const radarChartData = [
    { subject: 'January', campaign1: 80, campaign2: 90 },
    { subject: 'February', campaign1: 70, campaign2: 60 },
    { subject: 'March', campaign1: 50, campaign2: 70 },
    { subject: 'April', campaign1: 60, campaign2: 50 },
    { subject: 'May', campaign1: 90, campaign2: 40 },
    { subject: 'June', campaign1: 40, campaign2: 80 },
    { subject: 'July', campaign1: 60, campaign2: 70 },
  ]

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Sidebar - Column 1 */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#131313] text-white">
        <div className="p-6 flex items-center">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-[#131313] font-bold">D</span>
          </div>
          <h1 className="text-xl font-bold ml-3">Dashboard</h1>
        </div>
        
        {/* Navigation menu */}
        <nav className="mt-8">
          <ul className="space-y-2 px-4">
            <li className="p-2 rounded-md bg-white/10 flex items-center">
              <LayoutDashboard size={20} />
              <span className="ml-3 font-medium">Dashboard</span>
            </li>
            <li className="p-2 rounded-md hover:bg-white/5 flex items-center">
              <MessageSquare size={20} />
              <span className="ml-3">Messages</span>
            </li>
            <li className="p-2 rounded-md hover:bg-white/5 flex items-center">
              <Calendar size={20} />
              <span className="ml-3">Calendar</span>
            </li>
            <li className="p-2 rounded-md hover:bg-white/5 flex items-center">
              <Megaphone size={20} />
              <span className="ml-3">Campaigns</span>
            </li>
            <li className="p-2 rounded-md hover:bg-white/5 flex items-center">
              <Settings size={20} />
              <span className="ml-3">Settings</span>
            </li>
            <li className="p-2 rounded-md hover:bg-white/5 flex items-center">
              <HelpCircle size={20} />
              <span className="ml-3">Help</span>
            </li>
          </ul>
        </nav>
        
        {/* Free trial box */}
        <div className="mx-4 mt-auto mb-8 p-4 bg-white/10 rounded-lg absolute bottom-16">
          <h3 className="font-bold text-sm">Free Trial</h3>
          <p className="text-xs mt-1 text-gray-300">Your free trial ends in 10 days</p>
          <button className="mt-3 w-full py-2 bg-white text-[#131313] rounded-md text-sm font-medium">
            Upgrade Now
          </button>
        </div>
        
        {/* Logout */}
        <div className="absolute bottom-4 w-full px-4">
          <div className="flex items-center p-2 rounded-md hover:bg-white/5">
            <LogOut size={20} />
            <span className="ml-3">Log out</span>
          </div>
        </div>
      </aside>
      
      {/* Main Content - Column 2 */}
      <div className="ml-64 flex-1 min-h-screen bg-gray-50 p-6 border-r border-gray-200">
        {/* Stats Section */}
        <section className="stats-section">
          {/* Connection stats */}
          <div className="mb-6">
            <h3 className="text-gray-500 text-lg">Connections</h3>
            <div className="flex items-center mt-2">
              <span className="text-3xl font-normal">2,632</span>
              <div className="ml-2 px-2 py-1 bg-[#DDF6DE] text-[#608662] rounded flex items-center">
                <TrendingUp size={16} />
                <span className="ml-1 font-bold">56%</span>
              </div>
            </div>
          </div>
          
          {/* Followers stats */}
          <div className="mb-6">
            <h3 className="text-gray-500 text-lg">Followers</h3>
            <div className="flex items-center mt-2">
              <span className="text-3xl font-normal">2,667</span>
              <div className="ml-2 px-2 py-1 bg-[#DDF6DE] text-[#608662] rounded flex items-center">
                <TrendingUp size={16} />
                <span className="ml-1 font-bold">0%</span>
              </div>
            </div>
          </div>
          
          {/* Connect Invites stats */}
          <div className="mb-6">
            <h3 className="text-gray-500 text-lg">Connect Invites</h3>
            <div className="flex items-center mt-2">
              <span className="text-3xl font-normal">100</span>
              <div className="ml-2 px-2 py-1 bg-[#DDF6DE] text-[#608662] rounded flex items-center">
                <TrendingUp size={16} />
                <span className="ml-1 font-bold">60%</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Bar Chart */}
        <section className="chart-section mt-12">
          <h3 className="text-xl font-bold mb-6">Activity Overview</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="connections" fill="#C2ECC1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="followers" fill="#1F1F1F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="invites" fill="#C5C7F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4 space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#C2ECC1] rounded mr-2"></div>
              <span className="text-sm">Connections</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#1F1F1F] rounded mr-2"></div>
              <span className="text-sm">Follows</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#C5C7F6] rounded mr-2"></div>
              <span className="text-sm">Connect Invites</span>
            </div>
          </div>
        </section>
      </div>
      
      {/* Campaign Analytics - Column 3 */}
      <div className="flex-1 min-h-screen bg-white p-6">
        {/* Campaign Analytics Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Campaign Analytics</h2>
        </div>
        
        {/* Campaign Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Invitations sent */}
          <div>
            <h4 className="text-sm text-gray-500">Invitations sent</h4>
            <p className="text-xl font-bold mt-1">286</p>
          </div>
          
          {/* Pending Invitations */}
          <div>
            <h4 className="text-sm text-gray-500">Pending Invitations</h4>
            <p className="text-xl font-bold mt-1">12</p>
          </div>
          
          {/* Profile views */}
          <div>
            <h4 className="text-sm text-gray-500">Profile views</h4>
            <p className="text-xl font-bold mt-1">2891</p>
          </div>
        </div>
        
        {/* Donut Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">Campaign Distribution</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {donutChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4">
            {donutChartData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs ml-2">{entry.name} ({Math.round(entry.value / totalDonutValue * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Radar Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">Campaign Performance</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Campaign 1" dataKey="campaign1" stroke="#C2ECC1" fill="#C2ECC1" fillOpacity={0.3} />
                <Radar name="Campaign 2" dataKey="campaign2" stroke="#C5C7F6" fill="#C5C7F6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4">
            <div className="flex items-center">
              <div className="w-4 h-4 border border-[#C2ECC1] bg-[#C2ECC1] bg-opacity-30 rounded mr-2"></div>
              <span className="text-xs">Campaign 1</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 border border-[#C5C7F6] bg-[#C5C7F6] bg-opacity-30 rounded mr-2"></div>
              <span className="text-xs">Campaign 2</span>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div>
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="ml-4">
                <p className="text-sm">
                  <span className="font-bold">Alex Morgan</span> sent you a <span className="font-bold">message</span>.
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="ml-4">
                <p className="text-sm">
                  <span className="font-bold">Mujo Prosper</span> sent you a <span className="font-bold">connection request</span>.
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="ml-4">
                <p className="text-sm">
                  <span>Upcoming Task</span> <span className="font-bold">- Create a campaign for designers</span> due on <span className="font-bold">02/04/2023</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
