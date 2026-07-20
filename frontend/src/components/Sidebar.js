import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ScanLine,
  Users,
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
  Settings
} from 'lucide-react';
import BrainLogo from './BrainLogo';
import './Sidebar.css';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analysis', label: 'MRI Analysis', icon: ScanLine },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'insights', label: 'AI Insights', icon: Brain },
];

const Sidebar = ({ activeTab, onTabChange, collapsed, onToggleCollapse, onLogout, hospitalId, onOpenSettings }) => {
  return (
    <motion.aside
      className={`ndx-sidebar ${collapsed ? 'collapsed' : ''}`}
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <div className="ndx-sidebar-header">
        <BrainLogo size={34} showText={true} collapsed={collapsed} />
        <button
          className="ndx-sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="ndx-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`ndx-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="ndx-nav-active-bar"
                    layoutId="activeTab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </AnimatePresence>
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="ndx-sidebar-footer">
        <button className="ndx-nav-item ndx-nav-subtle" onClick={onOpenSettings} aria-label="Settings">
          <Settings size={18} strokeWidth={1.8} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button className="ndx-nav-item ndx-nav-subtle" onClick={() => {}} aria-label="Support">
          <HelpCircle size={18} strokeWidth={1.8} />
          {!collapsed && <span>Support</span>}
        </button>
        <div className="ndx-sidebar-divider" />
        <button className="ndx-nav-item ndx-nav-logout" onClick={onLogout} aria-label="Logout">
          <LogOut size={18} strokeWidth={1.8} />
          {!collapsed && <span>Exit Portal</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
