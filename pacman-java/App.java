import java.awt.BasicStroke;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GradientPaint;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;

public class App {

    static class DifficultySettings {
        int loopDelay;
        int startingLives;

        DifficultySettings(int loopDelay, int startingLives) {
            this.loopDelay = loopDelay;
            this.startingLives = startingLives;
        }
    }

    interface StartMenuListener {
        void onDifficultySelected(DifficultySettings settings);
    }

    static class MenuButton extends JButton {
        private final Color baseColor;
        private final Color hoverColor;
        private boolean hovered = false;

        MenuButton(String text, Color baseColor, Color hoverColor) {
            super(text);
            this.baseColor = baseColor;
            this.hoverColor = hoverColor;

            setFont(new Font("Monospaced", Font.BOLD, 22));
            setForeground(Color.WHITE);
            setFocusPainted(false);
            setBorderPainted(false);
            setContentAreaFilled(false);
            setOpaque(false);
            setHorizontalAlignment(SwingConstants.CENTER);
            setPreferredSize(new Dimension(280, 56));
            setMaximumSize(new Dimension(280, 56));
            setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));

            addMouseListener(new MouseAdapter() {
                @Override
                public void mouseEntered(MouseEvent e) {
                    hovered = true;
                    repaint();
                }

                @Override
                public void mouseExited(MouseEvent e) {
                    hovered = false;
                    repaint();
                }
            });
        }

        @Override
        protected void paintComponent(Graphics g) {
            Graphics2D g2 = (Graphics2D) g.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);
            g2.setColor(hovered ? hoverColor : baseColor);
            g2.fillRect(0, 0, getWidth(), getHeight());

            g2.setColor(new Color(255, 255, 255, 180));
            g2.setStroke(new BasicStroke(2f));
            g2.drawRect(1, 1, getWidth() - 3, getHeight() - 3);

            g2.setColor(new Color(255, 255, 255, hovered ? 75 : 45));
            for (int y = 4; y < getHeight(); y += 6) {
                g2.drawLine(0, y, getWidth(), y);
            }
            g2.dispose();

            super.paintComponent(g);
        }
    }

    static class StartMenuPanel extends JPanel {
        StartMenuPanel(StartMenuListener listener) {
            setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));
            setBorder(BorderFactory.createEmptyBorder(90, 80, 70, 80));
            setOpaque(false);

            JLabel title = new JLabel("PAC-MAN", SwingConstants.CENTER);
            title.setAlignmentX(CENTER_ALIGNMENT);
            title.setFont(new Font("Monospaced", Font.BOLD, 72));
            title.setForeground(new Color(255, 221, 0));

            JLabel subtitle = new JLabel("INSERT COIN  •  SELECT DIFFICULTY", SwingConstants.CENTER);
            subtitle.setAlignmentX(CENTER_ALIGNMENT);
            subtitle.setFont(new Font("Monospaced", Font.BOLD, 19));
            subtitle.setForeground(new Color(140, 255, 255));

            JPanel buttonPanel = new JPanel();
            buttonPanel.setLayout(new BoxLayout(buttonPanel, BoxLayout.Y_AXIS));
            buttonPanel.setOpaque(false);
            buttonPanel.setBorder(BorderFactory.createCompoundBorder(
                    BorderFactory.createLineBorder(new Color(90, 255, 255, 170), 2),
                    BorderFactory.createEmptyBorder(18, 18, 18, 18)
            ));

            MenuButton easyButton = new MenuButton("Easy", new Color(22, 172, 104), new Color(31, 205, 125));
            easyButton.setAlignmentX(CENTER_ALIGNMENT);
            easyButton.addActionListener(e -> listener.onDifficultySelected(new DifficultySettings(60, 4)));

            MenuButton normalButton = new MenuButton("Normal", new Color(48, 108, 220), new Color(72, 136, 255));
            normalButton.setAlignmentX(CENTER_ALIGNMENT);
            normalButton.addActionListener(e -> listener.onDifficultySelected(new DifficultySettings(50, 3)));

            MenuButton hardButton = new MenuButton("Hard", new Color(186, 54, 54), new Color(230, 74, 74));
            hardButton.setAlignmentX(CENTER_ALIGNMENT);
            hardButton.addActionListener(e -> listener.onDifficultySelected(new DifficultySettings(40, 2)));

            JLabel hint = new JLabel("ARROW KEYS TO MOVE  •  ANY KEY TO RESTART", SwingConstants.CENTER);
            hint.setAlignmentX(CENTER_ALIGNMENT);
            hint.setFont(new Font("Monospaced", Font.BOLD, 13));
            hint.setForeground(new Color(255, 210, 110));

            buttonPanel.add(easyButton);
            buttonPanel.add(Box.createRigidArea(new Dimension(0, 12)));
            buttonPanel.add(normalButton);
            buttonPanel.add(Box.createRigidArea(new Dimension(0, 12)));
            buttonPanel.add(hardButton);

            add(title);
            add(Box.createRigidArea(new Dimension(0, 10)));
            add(subtitle);
            add(Box.createRigidArea(new Dimension(0, 26)));
            add(buttonPanel);
            add(Box.createRigidArea(new Dimension(0, 18)));
            add(hint);
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            Graphics2D g2 = (Graphics2D) g.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);

            GradientPaint gradient = new GradientPaint(
                    0,
                    0,
                    new Color(8, 8, 26),
                    0,
                    getHeight(),
                    new Color(24, 4, 55)
            );
            g2.setPaint(gradient);
            g2.fillRect(0, 0, getWidth(), getHeight());

            g2.setColor(new Color(0, 255, 255, 38));
            for (int y = 0; y < getHeight(); y += 4) {
                g2.drawLine(0, y, getWidth(), y);
            }

            g2.setColor(new Color(255, 0, 255, 26));
            for (int x = 0; x < getWidth(); x += 64) {
                g2.drawLine(x, 0, x, getHeight());
            }

            g2.setColor(new Color(255, 255, 0, 35));
            g2.setStroke(new BasicStroke(3f));
            g2.drawRect(14, 14, getWidth() - 28, getHeight() - 28);

            g2.setColor(new Color(255, 255, 255, 22));
            for (int i = 0; i < 55; i++) {
                int x = (i * 97) % getWidth();
                int y = (i * 57) % getHeight();
                int size = 2 + (i % 3);
                g2.fillOval(x, y, size, size);
            }
            g2.dispose();
        }
    }

    public static void main(String[] args) throws Exception {
        int rowCount = 21;
        int columnCount = 19;
        int tileSize = 32;
        int boardWidth = columnCount * tileSize;
        int boardHeight = rowCount * tileSize;

        JFrame frame = new JFrame("Pac Man");
        frame.setSize(boardWidth, boardHeight);
        frame.setLocationRelativeTo(null);
        frame.setResizable(false);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        StartMenuPanel menuPanel = new StartMenuPanel(settings -> {
            PacMan pacmanGame = new PacMan(settings.loopDelay, settings.startingLives);
            frame.getContentPane().removeAll();
            frame.getContentPane().setLayout(new BorderLayout());
            frame.add(pacmanGame, BorderLayout.CENTER);
            frame.revalidate();
            frame.repaint();
            SwingUtilities.invokeLater(pacmanGame::requestFocusInWindow);
        });

        frame.add(menuPanel);
        frame.pack();
        frame.setVisible(true);

    }
}
