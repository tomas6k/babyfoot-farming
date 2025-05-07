# Sécurité et Validation des Données

## Vue d'ensemble

Ce document détaille les mesures de sécurité et les stratégies de validation des données pour les fonctions statistiques, assurant l'intégrité et la fiabilité des calculs.

## Validation des Entrées

### 1. Schémas de Validation

```typescript
// types/validation-schemas.ts
import { z } from 'zod';

export const MatchInputSchema = z.object({
  score_blue: z.number()
    .int()
    .min(0)
    .max(10)
    .describe('Score de l\'équipe bleue'),
    
  score_red: z.number()
    .int()
    .min(0)
    .max(10)
    .describe('Score de l\'équipe rouge'),
    
  blue_attacker_id: z.number()
    .int()
    .positive()
    .describe('ID de l\'attaquant bleu'),
    
  blue_defender_id: z.number()
    .int()
    .positive()
    .describe('ID du défenseur bleu'),
    
  red_attacker_id: z.number()
    .int()
    .positive()
    .describe('ID de l\'attaquant rouge'),
    
  red_defender_id: z.number()
    .int()
    .positive()
    .describe('ID du défenseur rouge'),
    
  created_at: z.date()
    .describe('Date de création du match')
});

export const StatsFilterSchema = z.object({
  start_date: z.date()
    .optional()
    .describe('Date de début de la période'),
    
  end_date: z.date()
    .optional()
    .describe('Date de fin de la période'),
    
  player_id: z.number()
    .int()
    .positive()
    .optional()
    .describe('ID du joueur pour filtrer les statistiques'),
    
  min_matches: z.number()
    .int()
    .min(1)
    .default(5)
    .describe('Nombre minimum de matches requis')
});
```

### 2. Middleware de Validation

```typescript
// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MatchInputSchema, StatsFilterSchema } from '../types/validation-schemas';

export const validateMatchInput = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const validatedData = MatchInputSchema.parse(req.body);
    req.body = validatedData;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Données de match invalides',
        details: error.errors
      });
    } else {
      next(error);
    }
  }
};

export const validateStatsFilter = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const validatedData = StatsFilterSchema.parse(req.query);
    req.query = validatedData;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Filtres de statistiques invalides',
        details: error.errors
      });
    } else {
      next(error);
    }
  }
};
```

## Sécurité des Données

### 1. Contrôle d'Accès

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const statsAccessControl = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'Token d\'authentification manquant'
      });
    }

    const decoded = await verifyToken(token);
    
    // Vérifier les permissions
    if (!decoded.permissions.includes('stats:read')) {
      return res.status(403).json({
        error: 'Permissions insuffisantes pour accéder aux statistiques'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Token invalide ou expiré'
    });
  }
};
```

### 2. Protection contre les Injections SQL

```typescript
// utils/sql-sanitization.ts
export const sanitizeInput = (input: string): string => {
  // Échapper les caractères spéciaux
  return input.replace(/['";\\]/g, '');
};

// Utilisation de paramètres préparés
const getPlayerStats = async (playerId: number) => {
  const query = `
    SELECT *
    FROM player_stats
    WHERE player_id = $1
  `;
  
  return await pool.query(query, [playerId]);
};
```

## Validation des Résultats

### 1. Vérification des Calculs

```typescript
// utils/stats-validation.ts
export class StatsValidator {
  static validateWinRate(winRate: number): boolean {
    return winRate >= 0 && winRate <= 100;
  }

  static validateMatchCounts(stats: MatchStats): boolean {
    return (
      stats.wins + stats.losses === stats.total_matches &&
      stats.total_matches >= 0
    );
  }

  static validatePlayerStats(stats: PlayerStats): ValidationResult {
    const errors: string[] = [];

    if (!this.validateWinRate(stats.win_rate)) {
      errors.push('Taux de victoire invalide');
    }

    if (!this.validateMatchCounts(stats)) {
      errors.push('Incohérence dans le nombre de matches');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### 2. Détection des Anomalies

```typescript
// utils/anomaly-detection.ts
export class StatsAnomalyDetector {
  private readonly thresholds = {
    winRateChange: 20,    // % de changement max acceptable
    matchCountSpike: 50,  // % d'augmentation max acceptable
    scoreDeviation: 2.5   // écarts-types max acceptables
  };

  detectAnomalies(
    currentStats: PlayerStats,
    historicalStats: PlayerStats
  ): AnomalyReport {
    const anomalies: Anomaly[] = [];

    // Vérifier les changements brusques de taux de victoire
    const winRateChange = Math.abs(
      currentStats.win_rate - historicalStats.win_rate
    );
    if (winRateChange > this.thresholds.winRateChange) {
      anomalies.push({
        type: 'win_rate_change',
        severity: 'high',
        details: `Changement de ${winRateChange.toFixed(2)}% du taux de victoire`
      });
    }

    // Vérifier les pics d'activité
    const matchCountIncrease = (
      (currentStats.matches - historicalStats.matches) / 
      historicalStats.matches * 100
    );
    if (matchCountIncrease > this.thresholds.matchCountSpike) {
      anomalies.push({
        type: 'activity_spike',
        severity: 'medium',
        details: `Augmentation de ${matchCountIncrease.toFixed(2)}% du nombre de matches`
      });
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies
    };
  }
}
```

## Journalisation et Audit

### 1. Journalisation des Accès

```typescript
// utils/stats-logger.ts
export class StatsLogger {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'stats-access.log' })
      ]
    });
  }

  logAccess(
    userId: string,
    action: string,
    details: object
  ): void {
    this.logger.info('Accès aux statistiques', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  logError(
    userId: string,
    error: Error,
    context: object
  ): void {
    this.logger.error('Erreur statistiques', {
      userId,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 2. Piste d'Audit

```sql
-- Tables d'audit
CREATE TABLE stats_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger pour l'audit
CREATE OR REPLACE FUNCTION log_stats_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stats_audit_log (
    user_id,
    action,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    current_setting('app.current_user_id')::INTEGER,
    TG_OP,
    row_to_json(NEW),
    current_setting('app.client_ip')::INET,
    current_setting('app.user_agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stats_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON player_stats
FOR EACH ROW EXECUTE FUNCTION log_stats_access();
```

## Gestion des Erreurs

```typescript
// utils/error-handling.ts
export class StatsErrorHandler {
  private readonly logger: StatsLogger;
  private readonly validator: StatsValidator;
  private readonly anomalyDetector: StatsAnomalyDetector;

  async handleError(
    error: Error,
    context: ErrorContext
  ): Promise<ErrorResponse> {
    // Logger l'erreur
    this.logger.logError(context.userId, error, context);

    // Classifier l'erreur
    const errorType = this.classifyError(error);

    // Générer la réponse appropriée
    switch (errorType) {
      case 'validation':
        return {
          status: 400,
          message: 'Données invalides',
          details: error.message
        };
        
      case 'permission':
        return {
          status: 403,
          message: 'Accès non autorisé',
          details: 'Permissions insuffisantes'
        };
        
      case 'calculation':
        return {
          status: 500,
          message: 'Erreur de calcul',
          details: 'Une erreur est survenue lors du calcul des statistiques'
        };
        
      default:
        return {
          status: 500,
          message: 'Erreur interne',
          details: 'Une erreur inattendue est survenue'
        };
    }
  }

  private classifyError(error: Error): ErrorType {
    if (error instanceof ValidationError) {
      return 'validation';
    }
    if (error instanceof PermissionError) {
      return 'permission';
    }
    if (error instanceof CalculationError) {
      return 'calculation';
    }
    return 'unknown';
  }
}
``` 